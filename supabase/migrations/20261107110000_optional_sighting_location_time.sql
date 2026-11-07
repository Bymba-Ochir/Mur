-- Pre-deploy: optional public observation details. Existing rows remain unchanged.
begin;

alter table public.sightings
  add column lat double precision,
  add column lng double precision,
  add column sighted_at timestamptz,
  add constraint sightings_coordinate_pair check (
    (lat is null and lng is null) or
    (lat is not null and lng is not null and lat between -90 and 90 and lng between -180 and 180)
  ),
  add constraint sightings_observation_time check (
    sighted_at is null or (created_at is not null and isfinite(sighted_at) and sighted_at <= created_at)
  );

-- Only the public observation fields are added to the existing column grants.
grant select (lat, lng, sighted_at) on public.sightings to anon, authenticated;

create function public.create_sighting_if_active(
  target_id uuid,
  target_pet uuid,
  target_reporter uuid,
  target_message text,
  target_place text,
  target_lat double precision,
  target_lng double precision,
  target_sighted_at timestamptz
)
returns table(created boolean, owner_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  pet_owner uuid;
  pet_resolved boolean;
begin
  select created_by, resolved into pet_owner, pet_resolved
  from public.pets
  where id = target_pet
  for update;
  if not found or pet_resolved then raise exception 'PET_NOT_ACTIVE'; end if;

  insert into public.sightings(id, pet_id, reporter_id, message, place, lat, lng, sighted_at)
  values(target_id, target_pet, target_reporter, target_message, target_place, target_lat, target_lng, target_sighted_at)
  on conflict (id) do nothing;

  created := found;
  owner_id := pet_owner;
  return next;
end;
$$;

-- Keep the old deployment and a code rollback compatible with this migration.
create or replace function public.create_sighting_if_active(
  target_id uuid,
  target_pet uuid,
  target_reporter uuid,
  target_message text,
  target_place text
)
returns table(created boolean, owner_id uuid)
language sql
security definer
set search_path = ''
as $$
  select * from public.create_sighting_if_active(
    target_id, target_pet, target_reporter, target_message, target_place, null, null, null
  );
$$;

revoke all on function public.create_sighting_if_active(uuid,uuid,uuid,text,text,double precision,double precision,timestamptz) from public, anon, authenticated;
grant execute on function public.create_sighting_if_active(uuid,uuid,uuid,text,text,double precision,double precision,timestamptz) to service_role;

revoke all on function public.create_sighting_if_active(uuid,uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.create_sighting_if_active(uuid,uuid,uuid,text,text) to service_role;

commit;
