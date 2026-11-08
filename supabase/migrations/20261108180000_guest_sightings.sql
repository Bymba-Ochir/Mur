-- Pre-deploy. Exact guest observations are isolated from the public feed.
begin;

create table public.guest_sightings (
  id uuid primary key default gen_random_uuid(),
  submission_key uuid not null unique,
  pet_id uuid not null references public.pets(id) on delete cascade,
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  place text check (char_length(place) <= 300),
  lat double precision,
  lng double precision,
  sighted_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  first_viewed_at timestamptz,
  useful_at timestamptz,
  state text not null default 'pending' check (state in ('pending', 'published', 'hidden')),
  check ((lat is null and lng is null) or
    (lat is not null and lng is not null and lat between -90 and 90 and lng between -180 and 180)),
  check (sighted_at is null or (isfinite(sighted_at) and sighted_at <= created_at))
);
create index guest_sightings_pet_created_idx on public.guest_sightings(pet_id, created_at desc, id desc);
alter table public.guest_sightings enable row level security;
revoke all on public.guest_sightings from public, anon, authenticated;

create index guest_sightings_created_idx on public.guest_sightings(created_at);
create table public.guest_sighting_opens (
  day date primary key,
  opens bigint not null default 1 check (opens > 0)
);
alter table public.guest_sighting_opens enable row level security;
revoke all on public.guest_sighting_opens from public, anon, authenticated;

create function public.count_guest_sighting_open()
returns void language sql security definer set search_path = '' as $$
  insert into public.guest_sighting_opens(day) values ((now() at time zone 'UTC')::date)
  on conflict (day) do update set opens = guest_sighting_opens.opens + 1;
$$;
revoke all on function public.count_guest_sighting_open() from public, anon, authenticated;
grant execute on function public.count_guest_sighting_open() to service_role;

alter table public.sightings add column guest_report boolean not null default false,
  add constraint sightings_guest_public_fields check (
    not guest_report or (
      message = 'Зочны мэдээлэл' and place is null and sighted_at is null
      and reporter_id is null and photo_path is null
      and (lat is null or lat = round(lat::numeric, 2)::double precision)
      and (lng is null or lng = round(lng::numeric, 2)::double precision)
    )
  );
grant select (guest_report) on public.sightings to anon, authenticated;

create or replace function public.queue_sighting_notification_v103()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not new.guest_report then
    perform public.enqueue_sighting_notification(new.id);
  end if;
  return new;
end;
$$;

create function public.submit_guest_sighting(
  target_key uuid, target_pet uuid, target_message text, target_place text,
  target_lat double precision, target_lng double precision, target_sighted_at timestamptz
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

  insert into public.guest_sightings(submission_key, pet_id, message, place, lat, lng, sighted_at)
    values (target_key, target_pet, target_message, target_place, target_lat, target_lng, target_sighted_at)
    on conflict (submission_key) do nothing returning id into report_id;
  if report_id is null then
    if exists (
      select 1 from public.guest_sightings g where g.submission_key = target_key
        and row(g.pet_id, g.message, g.place, g.lat, g.lng, g.sighted_at)
          is not distinct from row(target_pet, target_message, target_place, target_lat, target_lng, target_sighted_at)
    ) then return 'duplicate'; end if;
    return 'conflict';
  end if;

  perform public.enqueue_background_job('sighting-notification', 'sighting:' || report_id::text,
    jsonb_build_object('sightingId', report_id, 'petId', target_pet, 'ownerId', pet_owner, 'guest', true));
  return 'created';
end;
$$;

create function public.list_guest_sightings(
  target_pet uuid, target_owner uuid, before_created timestamptz, before_id uuid
) returns table(id uuid, created_at timestamptz, first_viewed_at timestamptz, useful_at timestamptz, state text)
language sql stable security definer set search_path = '' as $$
  select g.id, g.created_at, g.first_viewed_at, g.useful_at, g.state
  from public.guest_sightings g join public.pets p on p.id = g.pet_id
  where p.id = target_pet and p.created_by = target_owner
    and (before_created is null or (g.created_at, g.id) < (before_created, before_id))
  order by g.created_at desc, g.id desc limit 21
$$;

create function public.review_guest_sighting(target_pet uuid, target_id uuid, target_owner uuid, action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pet_resolved boolean;
  guest public.guest_sightings;
begin
  select resolved into pet_resolved from public.pets
    where id = target_pet and created_by = target_owner for update;
  if not found then return null; end if;

  select * into guest from public.guest_sightings
    where id = target_id and pet_id = target_pet for update;
  if not found then return null; end if;

  case action
    when 'view' then
      if guest.first_viewed_at is null then
        guest.first_viewed_at := clock_timestamp();
        update public.guest_sightings set first_viewed_at = guest.first_viewed_at where id = guest.id;
      end if;
    when 'useful' then
      if guest.useful_at is null then
        guest.useful_at := clock_timestamp();
        update public.guest_sightings set useful_at = guest.useful_at where id = guest.id;
      end if;
    when 'publish' then
      if pet_resolved is distinct from false then raise exception 'PET_NOT_ACTIVE'; end if;
      if guest.state <> 'published' then
        insert into public.sightings(id, pet_id, message, lat, lng, guest_report)
          values (guest.id, target_pet, 'Зочны мэдээлэл',
            round(guest.lat::numeric, 2), round(guest.lng::numeric, 2), true);
        guest.state := 'published';
        update public.guest_sightings set state = guest.state where id = guest.id;
      end if;
    when 'hide' then
      delete from public.sightings where id = guest.id and pet_id = target_pet and guest_report;
      guest.state := 'hidden';
      update public.guest_sightings set state = guest.state where id = guest.id;
    else raise exception 'INVALID_GUEST_SIGHTING_ACTION';
  end case;

  return to_jsonb(guest) - 'submission_key' - 'pet_id';
end;
$$;

revoke all on function public.submit_guest_sighting(uuid,uuid,text,text,double precision,double precision,timestamptz),
  public.list_guest_sightings(uuid,uuid,timestamptz,uuid), public.review_guest_sighting(uuid,uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.submit_guest_sighting(uuid,uuid,text,text,double precision,double precision,timestamptz),
  public.list_guest_sightings(uuid,uuid,timestamptz,uuid), public.review_guest_sighting(uuid,uuid,uuid,text)
  to service_role;

notify pgrst, 'reload schema';
commit;
