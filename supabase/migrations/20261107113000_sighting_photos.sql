-- Apply before deploying the optional sighting photo feature.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sighting-photos', 'sighting-photos', true, 3145728, array['image/jpeg']);

-- Public object reads use the bucket's public URL. No browser write policy.
alter table public.sightings
  add column photo_path text,
  add constraint sightings_photo_path_check check (
    photo_path is null or (
      reporter_id is not null
      and split_part(photo_path, '/', 1) = id::text
      and photo_path ~ '^[0-9a-f-]{36}/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/[0-9a-f]{64}[.]jpg$'
    )
  );

grant select (photo_path) on public.sightings to anon, authenticated;

-- The existing RPC still owns the active-pet lock and idempotent insert.
-- Attach the verified object in the same transaction as the sighting.
create function public.create_sighting_if_active(
  target_id uuid,
  target_pet uuid,
  target_reporter uuid,
  target_message text,
  target_place text,
  target_lat double precision,
  target_lng double precision,
  target_sighted_at timestamptz,
  target_photo_path text
)
returns table(created boolean, owner_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_photo_path is null or not exists (
    select 1 from storage.objects
    where bucket_id = 'sighting-photos' and name = target_photo_path
  ) then
    raise exception 'SIGHTING_PHOTO_MISSING';
  end if;

  select claim.created, claim.owner_id into created, owner_id
  from public.create_sighting_if_active(
    target_id, target_pet, target_reporter, target_message,
    target_place, target_lat, target_lng, target_sighted_at
  ) as claim;

  if created then
    update public.sightings set photo_path = target_photo_path where id = target_id;
  end if;
  return next;
end;
$$;

revoke all on function public.create_sighting_if_active(uuid,uuid,uuid,text,text,double precision,double precision,timestamptz,text) from public, anon, authenticated;
grant execute on function public.create_sighting_if_active(uuid,uuid,uuid,text,text,double precision,double precision,timestamptz,text) to service_role;

create function public.queue_sighting_photo_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.reporter_id is not distinct from old.reporter_id then return new; end if;
    new.photo_path := null;
  end if;

  if old.photo_path is not null then
    perform public.enqueue_background_job(
      'storage-cleanup', 'sighting-delete:' || split_part(old.photo_path, '/', 2),
      jsonb_build_object('sightingPhotoPath', old.photo_path)
    );
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.queue_sighting_photo_cleanup() from public, anon, authenticated;
create trigger sighting_photo_cleanup
  before delete or update of reporter_id on public.sightings
  for each row execute function public.queue_sighting_photo_cleanup();

commit;
