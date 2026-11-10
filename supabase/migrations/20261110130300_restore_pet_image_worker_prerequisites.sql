-- Restore the image worker prerequisites after the cover search migrations.
-- Reuse the fingerprint-aware provenance function installed by the cover migration.
-- This transaction only installs worker schema. It does not run the backfill.
begin;
set local lock_timeout = '5s';

alter table public.pets add column if not exists embedding_photo_url text;
alter table public.pets add column if not exists embedding_revision uuid;

alter table public.background_jobs drop constraint if exists background_jobs_kind_check;
alter table public.background_jobs add constraint background_jobs_kind_check
  check (kind in ('nearby-push','sighting-notification','storage-cleanup','avatar-cleanup','pet-image-embedding'));

create or replace function public.claim_background_job_kinds(accepted_kinds text[])
returns setof public.background_jobs language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_now timestamptz := clock_timestamp();
begin
  with exhausted as (
    select id from public.background_jobs
    where kind = any(accepted_kinds) and attempts >= 8
      and (status = 'pending' or (status = 'running' and locked_until <= v_now))
    order by available_at, created_at, id for update skip locked limit 100
  )
  update public.background_jobs j
  set status = 'failed', lease_token = null, locked_until = null, finished_at = v_now
  from exhausted e where j.id = e.id;

  return query
  with candidate as (
    select id from public.background_jobs
    where kind = any(accepted_kinds) and attempts < 8
      and ((status = 'pending' and available_at <= v_now) or (status = 'running' and locked_until <= v_now))
    order by available_at, created_at, id for update skip locked limit 1
  )
  update public.background_jobs j
  set status = 'running', attempts = j.attempts + 1,
      lease_token = gen_random_uuid(), locked_until = v_now + interval '120 seconds'
  from candidate c where j.id = c.id returning j.*;
end;
$$;

-- Old deployments only claim the kinds they already understand.
create or replace function public.claim_background_job()
returns setof public.background_jobs language sql security definer set search_path = pg_catalog, public as $$
  select * from public.claim_background_job_kinds(
    array['nearby-push','sighting-notification','storage-cleanup','avatar-cleanup']);
$$;
create or replace function public.claim_pet_image_job()
returns setof public.background_jobs language sql security definer set search_path = pg_catalog, public as $$
  select * from public.claim_background_job_kinds(array['pet-image-embedding']);
$$;

-- Authenticated requests cannot set the provenance used by the server worker.
drop trigger if exists protect_pet_image_provenance on public.pets;
create trigger protect_pet_image_provenance
before insert or update on public.pets
for each row execute function public.protect_pet_image_provenance();

create or replace function public.queue_pet_image_embedding()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  pet_id_value uuid;
  pet public.pets;
  source_url text;
  revision_value uuid;
begin
  if tg_op = 'DELETE' then pet_id_value := old.pet_id; else pet_id_value := new.pet_id; end if;
  select * into pet from public.pets where id = pet_id_value for update;
  if not found then return null; end if;
  select p.url into source_url from public.pet_photos p
    where p.pet_id = pet_id_value order by p.position limit 1;
  if source_url is not distinct from pet.embedding_photo_url then return null; end if;
  revision_value := gen_random_uuid();
  update public.pets set embedding_photo_url = source_url, embedding_revision = revision_value,
    dino_embedding = null, color_signature = null, embedding_version = null, image_hash = null
    where id = pet_id_value;
  if source_url is not null then
    perform public.enqueue_background_job('pet-image-embedding', 'pet-image:' || revision_value::text,
      jsonb_build_object('petId',pet_id_value,'revision',revision_value));
  end if;
  return null;
end;
$$;
-- Deferral observes the final replacement, including delete/reinsert of the same URL.
drop trigger if exists queue_pet_image_embedding on public.pet_photos;
create constraint trigger queue_pet_image_embedding
after insert or update or delete on public.pet_photos
deferrable initially deferred
for each row execute function public.queue_pet_image_embedding();

create or replace function public.complete_pet_image_embedding(
  target_job uuid, target_lease uuid, target_embedding real[], target_hash text
)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare job public.background_jobs; pet public.pets; current_url text;
begin
  if array_ndims(target_embedding) is distinct from 1 or cardinality(target_embedding) is distinct from 384
    or exists (select 1 from unnest(target_embedding) x where x is null or not (x between -1 and 1))
    or (select sum(x::double precision * x::double precision) from unnest(target_embedding) x) not between 0.99 and 1.01
    or target_hash is null or target_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'INVALID_IMAGE_EMBEDDING';
  end if;
  select * into job from public.background_jobs where id = target_job for update;
  if not found or job.kind <> 'pet-image-embedding' or job.status <> 'running'
    or job.lease_token is distinct from target_lease or job.locked_until <= clock_timestamp() then return false; end if;
  select * into pet from public.pets where id = (job.payload->>'petId')::uuid for update;
  if not found or pet.embedding_revision is distinct from (job.payload->>'revision')::uuid then return false; end if;
  select p.url into current_url from public.pet_photos p
    where p.pet_id = pet.id order by p.position limit 1;
  if current_url is null or current_url is distinct from pet.embedding_photo_url then return false; end if;
  update public.pets set dino_embedding = target_embedding::extensions.vector(384),
    color_signature = to_jsonb(target_embedding), embedding_version = 'dinov2-small-q8-v1', image_hash = target_hash
    where id = pet.id;
  return true;
end;
$$;

revoke all on function public.claim_background_job_kinds(text[]) from public, anon, authenticated;
revoke all on function public.claim_background_job() from public, anon, authenticated;
revoke all on function public.claim_pet_image_job() from public, anon, authenticated;
revoke all on function public.protect_pet_image_provenance() from public, anon, authenticated;
revoke all on function public.queue_pet_image_embedding() from public, anon, authenticated;
revoke all on function public.complete_pet_image_embedding(uuid,uuid,real[],text) from public, anon, authenticated;
grant execute on function public.claim_background_job_kinds(text[]), public.claim_background_job(),
  public.claim_pet_image_job(), public.complete_pet_image_embedding(uuid,uuid,real[],text) to service_role;

notify pgrst, 'reload schema';
commit;
