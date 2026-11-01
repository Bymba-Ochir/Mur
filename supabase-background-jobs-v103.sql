-- Mur v103 PRE-DEPLOY. Run manually in Supabase SQL Editor before the new code.
-- Requires v96 normalized photos and v99 sighting RPC. No production data backfill.
begin;

create table if not exists public.background_jobs (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique check (char_length(dedupe_key) between 1 and 200),
  kind text not null check (kind in ('nearby-push','sighting-notification','storage-cleanup','avatar-cleanup')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 16384),
  cursor_id uuid,
  status text not null default 'pending' check (status in ('pending','running','done','failed')),
  attempts integer not null default 0 check (attempts between 0 and 8),
  available_at timestamptz not null default now(),
  lease_token uuid,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  check ((status = 'running') = (lease_token is not null and locked_until is not null))
);
alter table public.background_jobs enable row level security;
revoke all on public.background_jobs from public, anon, authenticated;
create index if not exists background_jobs_pending_idx
  on public.background_jobs(available_at, created_at, id) where status = 'pending';
create index if not exists background_jobs_expired_idx
  on public.background_jobs(locked_until) where status = 'running';
create index if not exists push_subscriptions_district_job_idx
  on public.push_subscriptions(district, id) include (created_at);

create or replace function public.enqueue_background_job(target_kind text, target_key text, target_payload jsonb)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare job_id uuid;
begin
  insert into public.background_jobs(kind,dedupe_key,payload)
  values(target_kind,target_key,target_payload)
  on conflict (dedupe_key) do nothing returning id into job_id;
  if job_id is null then
    select id into job_id from public.background_jobs where dedupe_key = target_key;
  end if;
  return job_id;
end;
$$;

-- Canonical DB data only: a webhook cannot supply recipients or push payloads.
create or replace function public.enqueue_nearby_notification(target_pet uuid)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare pet public.pets; job_id uuid;
begin
  select * into pet from public.pets where id = target_pet;
  if not found or pet.district is null or pet.resolved then return null; end if;
  job_id := public.enqueue_background_job('nearby-push','nearby:' || pet.id::text,
    jsonb_build_object('petId',pet.id,'district',pet.district,'status',pet.status,
      'type',pet.type,'place',coalesce(pet.place,'')));
  return job_id;
end;
$$;

create or replace function public.enqueue_sighting_notification(target_id uuid)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare sighting record;
begin
  select s.id,s.pet_id,s.place,s.reporter_id,p.created_by into sighting
  from public.sightings s join public.pets p on p.id = s.pet_id where s.id = target_id;
  if not found or sighting.created_by is null or sighting.created_by = sighting.reporter_id then return null; end if;
  return public.enqueue_background_job('sighting-notification','sighting:' || sighting.id::text,
    jsonb_build_object('sightingId',sighting.id,'petId',sighting.pet_id,
      'ownerId',sighting.created_by,'place',coalesce(sighting.place,'')));
end;
$$;

-- The outbox entry commits/rolls back with v99's row-locked sighting insert.
create or replace function public.queue_sighting_notification_v103()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.enqueue_sighting_notification(new.id);
  return new;
end;
$$;
drop trigger if exists sighting_background_job_v103 on public.sightings;
create trigger sighting_background_job_v103 after insert on public.sightings
  for each row execute function public.queue_sighting_notification_v103();

-- Snapshot at most four normalized photo URLs BEFORE cascading child deletion.
-- No browser-supplied bucket/path/owner can enter a cleanup job.
create or replace function public.queue_content_cleanup_v103()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare urls jsonb := '[]'::jsonb; owner_id uuid;
begin
  if tg_table_name = 'pets' then
    owner_id := old.created_by;
    select coalesce(jsonb_agg(url),'[]'::jsonb) into urls
    from (select url from public.pet_photos where pet_id = old.id order by position limit 4) photos;
  elsif tg_table_name = 'adoptions' then
    owner_id := old.created_by;
    select coalesce(jsonb_agg(url),'[]'::jsonb) into urls
    from (select url from public.adoption_photos where adoption_id = old.id order by position limit 4) photos;
  elsif tg_table_name = 'sitting_listings' then
    owner_id := old.user_id;
    if old.photo_url is not null then urls := jsonb_build_array(old.photo_url); end if;
  end if;
  if owner_id is not null and jsonb_array_length(urls) > 0 then
    perform public.enqueue_background_job('storage-cleanup','storage:' || tg_table_name || ':' || old.id::text,
      jsonb_build_object('ownerId',owner_id,'urls',urls));
  end if;
  return old;
end;
$$;
drop trigger if exists pet_cleanup_job_v103 on public.pets;
create trigger pet_cleanup_job_v103 before delete on public.pets
  for each row execute function public.queue_content_cleanup_v103();
drop trigger if exists adoption_cleanup_job_v103 on public.adoptions;
create trigger adoption_cleanup_job_v103 before delete on public.adoptions
  for each row execute function public.queue_content_cleanup_v103();
drop trigger if exists sitting_cleanup_job_v103 on public.sitting_listings;
create trigger sitting_cleanup_job_v103 before delete on public.sitting_listings
  for each row execute function public.queue_content_cleanup_v103();

create or replace function public.queue_avatar_cleanup_v103()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.enqueue_background_job('avatar-cleanup','avatar:' || old.id::text,
    jsonb_build_object('ownerId',old.id));
  return old;
end;
$$;
drop trigger if exists avatar_cleanup_job_v103 on auth.users;
create trigger avatar_cleanup_job_v103 after delete on auth.users
  for each row execute function public.queue_avatar_cleanup_v103();

-- Single, short claim transaction; multiple workers never claim the same lease.
create or replace function public.claim_background_job()
returns setof public.background_jobs language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_now timestamptz := clock_timestamp();
begin
  with exhausted as (
    select id from public.background_jobs where status = 'running' and locked_until <= v_now and attempts >= 8
    order by locked_until for update skip locked limit 20
  )
  update public.background_jobs j set status = 'failed', lease_token = null, locked_until = null, finished_at = v_now
  from exhausted e where j.id = e.id;

  return query
  with candidate as (
    select id from public.background_jobs
    where attempts < 8 and ((status = 'pending' and available_at <= v_now)
      or (status = 'running' and locked_until <= v_now))
    order by available_at, created_at, id for update skip locked limit 1
  )
  update public.background_jobs j
  set status = 'running', attempts = j.attempts + 1,
      lease_token = gen_random_uuid(), locked_until = v_now + interval '120 seconds'
  from candidate c where j.id = c.id returning j.*;
end;
$$;

-- Fencing rejects acknowledgements/checkpoints from expired or replaced workers.
create or replace function public.finish_background_job(target_id uuid, target_lease uuid, outcome text, next_cursor uuid default null)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare changed integer; v_now timestamptz := clock_timestamp();
begin
  if outcome not in ('done','continue','retry') or outcome is null then raise exception 'INVALID_JOB_OUTCOME'; end if;
  if outcome = 'continue' and next_cursor is null then raise exception 'MISSING_JOB_CURSOR'; end if;
  update public.background_jobs j set
    status = case when outcome = 'done' then 'done'
      when outcome = 'retry' and j.attempts >= 8 then 'failed' else 'pending' end,
    cursor_id = case when outcome = 'continue' then next_cursor else j.cursor_id end,
    attempts = case when outcome = 'continue' then 0 else j.attempts end,
    available_at = case when outcome = 'retry' then v_now + make_interval(secs => least(3600,20 * (2 ^ (j.attempts - 1)))::integer) else v_now end,
    finished_at = case when outcome = 'done' or (outcome = 'retry' and j.attempts >= 8) then v_now else null end,
    payload = case when outcome = 'done' then '{}'::jsonb else j.payload end,
    lease_token = null, locked_until = null
  where j.id = target_id and j.status = 'running' and j.lease_token = target_lease and j.locked_until > v_now
    and (outcome <> 'continue' or (j.kind = 'nearby-push' and (j.cursor_id is null or next_cursor > j.cursor_id)));
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

-- DISTINCT before LIMIT prevents duplicate references hiding one of four URLs.
create or replace function public.referenced_listing_photo_urls(target_urls text[])
returns table(url text) language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if coalesce(array_length(target_urls,1),0) > 4 then raise exception 'TOO_MANY_PHOTO_URLS'; end if;
  return query
  select refs.url from (
    select p.url from public.pet_photos p where p.url = any(target_urls)
    union select a.url from public.adoption_photos a where a.url = any(target_urls)
    union select s.photo_url from public.sitting_listings s where s.photo_url = any(target_urls)
  ) refs limit 4;
end;
$$;
create index if not exists pet_photos_cleanup_url_idx on public.pet_photos using hash(url);
create index if not exists adoption_photos_cleanup_url_idx on public.adoption_photos using hash(url);
create index if not exists sitting_cleanup_url_idx on public.sitting_listings using hash(photo_url) where photo_url is not null;

revoke all on function public.enqueue_background_job(text,text,jsonb) from public,anon,authenticated;
revoke all on function public.enqueue_nearby_notification(uuid) from public,anon,authenticated;
revoke all on function public.enqueue_sighting_notification(uuid) from public,anon,authenticated;
revoke all on function public.queue_sighting_notification_v103() from public,anon,authenticated;
revoke all on function public.queue_content_cleanup_v103() from public,anon,authenticated;
revoke all on function public.queue_avatar_cleanup_v103() from public,anon,authenticated;
revoke all on function public.claim_background_job() from public,anon,authenticated;
revoke all on function public.finish_background_job(uuid,uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.referenced_listing_photo_urls(text[]) from public,anon,authenticated;
grant execute on function public.enqueue_background_job(text,text,jsonb), public.enqueue_nearby_notification(uuid),
  public.enqueue_sighting_notification(uuid), public.claim_background_job(),
  public.finish_background_job(uuid,uuid,text,uuid), public.referenced_listing_photo_urls(text[]) to service_role;

notify pgrst, 'reload schema';
commit;
