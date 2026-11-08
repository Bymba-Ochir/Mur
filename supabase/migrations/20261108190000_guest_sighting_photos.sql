-- Apply before deploying optional guest sighting attachments.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guest-sighting-photos', 'guest-sighting-photos', false, 3145728, array['image/jpeg']);

create policy "Guest sighting photos are server-only"
on storage.objects as restrictive for all to anon, authenticated
using (bucket_id is distinct from 'guest-sighting-photos')
with check (bucket_id is distinct from 'guest-sighting-photos');

alter table public.guest_sightings
  add column photo_path text,
  add constraint guest_sightings_photo_path_check check (
    photo_path is null or (
      split_part(photo_path, '/', 1) = submission_key::text
      and photo_path ~ '^[0-9a-f-]{36}/[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/[0-9a-f]{64}[.]jpg$'
    )
  );

create function public.submit_guest_sighting(
  target_key uuid, target_pet uuid, target_message text, target_place text,
  target_lat double precision, target_lng double precision, target_sighted_at timestamptz,
  target_photo_path text
) returns text language plpgsql security definer set search_path = '' as $$
declare
  pet_owner uuid;
  pet_resolved boolean;
  report_id uuid;
begin
  select created_by, resolved into pet_owner, pet_resolved
    from public.pets where id = target_pet for update;
  if not found or pet_resolved is distinct from false or pet_owner is null then
    raise exception 'PET_NOT_ACTIVE';
  end if;

  if target_photo_path is not null and not exists (
    select 1 from storage.objects
    where bucket_id = 'guest-sighting-photos' and name = target_photo_path
  ) then raise exception 'SIGHTING_PHOTO_MISSING'; end if;

  insert into public.guest_sightings(submission_key, pet_id, message, place, lat, lng, sighted_at, photo_path)
    values (target_key, target_pet, target_message, target_place, target_lat, target_lng, target_sighted_at, target_photo_path)
    on conflict (submission_key) do nothing returning id into report_id;
  if report_id is null then
    if exists (
      select 1 from public.guest_sightings g where g.submission_key = target_key
        and row(g.pet_id, g.message, g.place, g.lat, g.lng, g.sighted_at, split_part(g.photo_path, '/', 3))
          is not distinct from row(target_pet, target_message, target_place, target_lat, target_lng,
            target_sighted_at, split_part(target_photo_path, '/', 3))
    ) then return 'duplicate'; end if;
    return 'conflict';
  end if;

  perform public.enqueue_background_job('sighting-notification', 'sighting:' || report_id::text,
    jsonb_build_object('sightingId', report_id, 'petId', target_pet, 'ownerId', pet_owner, 'guest', true));
  return 'created';
end;
$$;

-- Preserve the existing deployment during migration and rollback.
create or replace function public.submit_guest_sighting(
  target_key uuid, target_pet uuid, target_message text, target_place text,
  target_lat double precision, target_lng double precision, target_sighted_at timestamptz
) returns text language sql security definer set search_path = '' as $$
  select public.submit_guest_sighting(target_key, target_pet, target_message, target_place,
    target_lat, target_lng, target_sighted_at, null);
$$;

create function public.read_guest_sighting_photo(target_pet uuid, target_id uuid, target_owner uuid)
returns text language sql stable security definer set search_path = '' as $$
  select g.photo_path
  from public.guest_sightings g join public.pets p on p.id = g.pet_id
  where p.id = target_pet and p.created_by = target_owner and g.id = target_id;
$$;

create function public.queue_guest_sighting_photo_cleanup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.photo_path is not null then
    perform public.enqueue_background_job(
      'storage-cleanup', 'guest-sighting-delete:' || split_part(old.photo_path, '/', 2),
      jsonb_build_object('guestSightingPhotoPath', old.photo_path)
    );
  end if;
  return old;
end;
$$;

create trigger guest_sighting_photo_cleanup after delete on public.guest_sightings
  for each row execute function public.queue_guest_sighting_photo_cleanup();

revoke all on function public.submit_guest_sighting(uuid,uuid,text,text,double precision,double precision,timestamptz,text),
  public.read_guest_sighting_photo(uuid,uuid,uuid), public.queue_guest_sighting_photo_cleanup()
  from public, anon, authenticated;
grant execute on function public.submit_guest_sighting(uuid,uuid,text,text,double precision,double precision,timestamptz,text),
  public.read_guest_sighting_photo(uuid,uuid,uuid) to service_role;

notify pgrst, 'reload schema';
commit;
