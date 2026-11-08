-- Preserve existing private attachments. Guest consent and an owner action are both required.
begin;

alter table public.guest_sightings
  add column photo_share_allowed boolean not null default false,
  add constraint guest_sightings_public_photo_consent_check check (not photo_share_allowed or photo_path is not null);

alter table public.sightings
  add column guest_photo_public boolean not null default false,
  add constraint sightings_public_guest_photo_check check (not guest_photo_public or guest_report);
grant select (guest_photo_public) on public.sightings to anon, authenticated;

create function public.submit_guest_sighting_with_photo_consent(
  target_key uuid, target_pet uuid, target_message text, target_place text,
  target_lat double precision, target_lng double precision, target_sighted_at timestamptz,
  target_photo_path text, allow_public_photo boolean
) returns text language plpgsql security definer set search_path = '' as $$
declare
  result text;
begin
  if target_photo_path is null or allow_public_photo is null then raise exception 'SIGHTING_PHOTO_MISSING'; end if;

  result := public.submit_guest_sighting(target_key, target_pet, target_message, target_place,
    target_lat, target_lng, target_sighted_at, target_photo_path);
  if result = 'created' and allow_public_photo then
    update public.guest_sightings set photo_share_allowed = true where submission_key = target_key;
  elsif result = 'duplicate' and not exists (
    select 1 from public.guest_sightings where submission_key = target_key and photo_share_allowed = allow_public_photo
  ) then
    return 'conflict';
  end if;
  return result;
end;
$$;

create function public.review_guest_sighting_with_photo(
  target_pet uuid, target_id uuid, target_owner uuid, action text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  result jsonb;
begin
  -- The existing review RPC checks the owner and takes the listing/report locks.
  result := public.review_guest_sighting(target_pet, target_id, target_owner,
    case action when 'publish_photo' then 'publish' when 'hide_photo' then 'view' else action end);
  if result is null then return null; end if;

  if action = 'publish_photo' then
    if result->>'photo_path' is null or result->'photo_share_allowed' is distinct from 'true'::jsonb then
      raise exception 'GUEST_PHOTO_CONSENT_REQUIRED';
    end if;
    update public.sightings set guest_photo_public = true where id = target_id and pet_id = target_pet and guest_report;
  elsif action = 'hide_photo' then
    update public.sightings set guest_photo_public = false where id = target_id and pet_id = target_pet and guest_report;
  end if;

  return result || jsonb_build_object('photoPublic', exists (
    select 1 from public.sightings where id = target_id and pet_id = target_pet and guest_photo_public
  ));
end;
$$;

create function public.read_published_guest_sighting_photo(target_pet uuid, target_id uuid)
returns text language sql stable security definer set search_path = '' as $$
  select g.photo_path
  from public.guest_sightings g
  join public.sightings s on s.id = g.id and s.pet_id = g.pet_id
  where g.pet_id = target_pet and g.id = target_id and g.state = 'published'
    and g.photo_share_allowed and s.guest_report and s.guest_photo_public;
$$;

revoke all on function public.submit_guest_sighting_with_photo_consent(uuid,uuid,text,text,double precision,double precision,timestamptz,text,boolean),
  public.review_guest_sighting_with_photo(uuid,uuid,uuid,text), public.read_published_guest_sighting_photo(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.submit_guest_sighting_with_photo_consent(uuid,uuid,text,text,double precision,double precision,timestamptz,text,boolean),
  public.review_guest_sighting_with_photo(uuid,uuid,uuid,text), public.read_published_guest_sighting_photo(uuid,uuid)
  to service_role;

notify pgrst, 'reload schema';
commit;
