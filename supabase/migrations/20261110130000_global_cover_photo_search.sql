-- Apply before deploying the global cover search. The existing worker backfills in small batches.
begin;

alter table public.pets add column cover_fingerprint bit(64);

create or replace function public.protect_pet_image_provenance()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if current_user in ('anon','authenticated') then
    if tg_op = 'INSERT' then
      new.embedding_photo_url := null;
      new.embedding_revision := null;
      new.cover_fingerprint := null;
    else
      new.embedding_photo_url := old.embedding_photo_url;
      new.embedding_revision := old.embedding_revision;
      new.cover_fingerprint := old.cover_fingerprint;
    end if;
  elsif tg_op = 'UPDATE' and new.embedding_revision is distinct from old.embedding_revision then
    new.cover_fingerprint := null;
  end if;
  return new;
end;
$$;

-- Persist the small hash before running inference, under the same lease and photo revision.
create function public.save_pet_cover_fingerprint(target_job uuid, target_lease uuid, target_fingerprint text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare job public.background_jobs; pet public.pets;
begin
  if target_fingerprint is null or target_fingerprint !~ '^[01]{64}$' then
    raise exception 'INVALID_COVER_FINGERPRINT';
  end if;
  select * into job from public.background_jobs where id = target_job for update;
  if not found or job.kind <> 'pet-image-embedding' or job.status <> 'running'
    or job.lease_token is distinct from target_lease or job.locked_until <= clock_timestamp() then return false; end if;
  select * into pet from public.pets where id = (job.payload->>'petId')::uuid for update;
  if not found or pet.embedding_revision is distinct from (job.payload->>'revision')::uuid
    or pet.embedding_photo_url is null then return false; end if;
  update public.pets set cover_fingerprint = target_fingerprint::bit(64) where id = pet.id;
  return true;
end;
$$;

create function public.queue_missing_pet_cover_fingerprints()
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare candidate record; revision uuid;
begin
  for candidate in
    select p.id, p.embedding_revision, p.embedding_photo_url, cover.url
    from public.pets p
    cross join lateral (
      select pp.url from public.pet_photos pp where pp.pet_id = p.id order by pp.position limit 1
    ) cover
    where not p.resolved and not p.is_hidden and p.cover_fingerprint is null
      and not exists (
        select 1 from public.background_jobs j
        where j.dedupe_key = 'pet-cover:' || p.embedding_revision::text
          or (j.dedupe_key = 'pet-image:' || p.embedding_revision::text and j.status in ('pending', 'running'))
      )
    order by p.created_at desc, p.id
    limit 3 for update of p skip locked
  loop
    revision := candidate.embedding_revision;
    if revision is null or candidate.embedding_photo_url is distinct from candidate.url then
      revision := gen_random_uuid();
      update public.pets set embedding_revision = revision, embedding_photo_url = candidate.url,
        dino_embedding = null, color_signature = null, embedding_version = null, image_hash = null
        where id = candidate.id;
    end if;
    perform public.enqueue_background_job('pet-image-embedding', 'pet-cover:' || revision::text,
      jsonb_build_object('petId', candidate.id, 'revision', revision, 'coverOnly', true));
  end loop;
end;
$$;

-- This is candidate retrieval. The browser verifies the actual image pixels before displaying a match.
create function public.match_pet_cover_ids(
  query_fingerprint text, query_status text, query_type text, query_district text, query_text text
)
returns table (id uuid) language sql stable security invoker set search_path = pg_catalog, public as $$
  with input as (
    select case when query_fingerprint ~ '^[01]{64}$' then query_fingerprint::bit(64) end as fingerprint,
      lower(left(btrim(coalesce(query_text, '')), 100)) as term
  )
  select p.id from public.pets p cross join input i
  where p.cover_fingerprint is not null and not p.resolved and not p.is_hidden
    and (query_status is null or p.status = query_status)
    and (query_type is null or p.type = query_type)
    and (query_district is null or p.district = query_district)
    and (i.term = '' or exists (
      select 1 from unnest(array[p.name, p.breed, p.color, p.place, p.type]) as field(value)
      where strpos(lower(field.value), i.term) > 0
    ))
    and bit_count(p.cover_fingerprint # i.fingerprint) <= 10
  order by bit_count(p.cover_fingerprint # i.fingerprint), p.created_at desc, p.id
  limit 8;
$$;

revoke all on function public.save_pet_cover_fingerprint(uuid,uuid,text),
  public.queue_missing_pet_cover_fingerprints() from public, anon, authenticated;
grant execute on function public.save_pet_cover_fingerprint(uuid,uuid,text),
  public.queue_missing_pet_cover_fingerprints() to service_role;
revoke all on function public.match_pet_cover_ids(text,text,text,text,text) from public;
grant execute on function public.match_pet_cover_ids(text,text,text,text,text) to anon, authenticated;

commit;
