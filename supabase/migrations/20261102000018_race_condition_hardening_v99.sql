-- Historical migration source: supabase-race-condition-hardening-v99.sql
-- Fresh local bootstrap; never replay this history blindly on an existing production database.

-- MUR v99: race-condition hardening
-- Apply only after the compatible app code is deployed successfully.
-- No destructive cleanup is performed. If existing appointment duplicates would
-- violate the new invariant, this migration aborts instead of deleting data.

begin;

-- 1) Serialize favorite toggles for the same (user, pet). Without this, two
-- concurrent toggles can both observe "not present" and race on INSERT.
create or replace function public.toggle_pet_favorite(target_pet uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  added boolean;
begin
  if viewer is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.pets where id = target_pet) then raise exception 'PET_NOT_FOUND'; end if;

  perform pg_advisory_xact_lock(hashtextextended(viewer::text || ':' || target_pet::text, 0));

  delete from public.pet_favorites where user_id = viewer and pet_id = target_pet;
  if found then
    added := false;
  else
    insert into public.pet_favorites(user_id, pet_id) values(viewer, target_pet);
    added := true;
  end if;
  return added;
end;
$$;
revoke all on function public.toggle_pet_favorite(uuid) from public;
grant execute on function public.toggle_pet_favorite(uuid) to authenticated;

-- 2) Adoption transition. PostgreSQL already row-locks the target application;
-- the partial unique index below is the cross-row invariant that prevents two
-- applications for one listing from both becoming accepted.
create or replace function public.transition_adoption_application(
  target_application uuid,
  target_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  app_row public.adoption_applications%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if target_status not in ('accepted','rejected','cancelled') then raise exception 'INVALID_APPLICATION_STATUS'; end if;

  select * into app_row
  from public.adoption_applications
  where id = target_application
  for update;
  if not found then raise exception 'APPLICATION_NOT_FOUND'; end if;
  if app_row.status = target_status then return app_row.status; end if;

  update public.adoption_applications
  set status = target_status
  where id = target_application;

  return target_status;
end;
$$;
revoke all on function public.transition_adoption_application(uuid,text) from public;
grant execute on function public.transition_adoption_application(uuid,text) to authenticated;

-- Cross-row invariant: at most one accepted application per adoption listing.
do $$
begin
  if exists (
    select 1 from public.adoption_applications
    where status = 'accepted'
    group by adoption_id
    having count(*) > 1
  ) then
    raise exception 'RACE_HARDENING_ABORT: multiple accepted adoption applications exist';
  end if;
end $$;
create unique index if not exists adoption_application_one_accepted
  on public.adoption_applications(adoption_id)
  where status = 'accepted';

-- 3) Sitting transition. The exclusion constraint below is transaction-safe:
-- overlapping accepted ranges for the same sitter cannot commit concurrently.
create extension if not exists btree_gist;

do $$
begin
  if exists (
    select 1
    from public.sitting_bookings a
    join public.sitting_bookings b
      on a.id < b.id
     and a.sitter_id = b.sitter_id
     and a.status = 'accepted'
     and b.status = 'accepted'
     and a.start_date <= b.end_date
     and b.start_date <= a.end_date
  ) then
    raise exception 'RACE_HARDENING_ABORT: overlapping accepted sitting bookings exist';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sitting_no_overlapping_accepted') then
    alter table public.sitting_bookings
      add constraint sitting_no_overlapping_accepted
      exclude using gist (
        sitter_id with =,
        daterange(start_date, end_date, '[]') with &&
      ) where (status = 'accepted');
  end if;
end $$;

create or replace function public.transition_sitting_booking(
  target_booking uuid,
  target_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row public.sitting_bookings%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if target_status not in ('accepted','rejected','completed','cancelled') then raise exception 'INVALID_BOOKING_STATUS'; end if;

  select * into booking_row
  from public.sitting_bookings
  where id = target_booking
  for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if booking_row.status = target_status then return booking_row.status; end if;

  update public.sitting_bookings
  set status = target_status
  where id = target_booking;

  return target_status;
end;
$$;
revoke all on function public.transition_sitting_booking(uuid,text) from public;
grant execute on function public.transition_sitting_booking(uuid,text) to authenticated;

-- 3a) Application creation must conflict with an adoption acceptance. Locking
-- the listing in SHARE mode means an ACCEPT (which takes UPDATE lock) waits
-- until the new pending row is visible and can be rejected in the same flow.
create or replace function public.prepare_adoption_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select created_by into new.owner_id
  from public.adoptions
  where id = new.adoption_id and adopted = false
  for share;
  if new.owner_id is null then raise exception 'ADOPTION_UNAVAILABLE'; end if;
  new.applicant_id := auth.uid();
  return new;
end;
$$;

-- 3b) Sighting creation and pet resolution must not cross in flight. Lock the
-- pet row, verify it is still active, then insert the idempotent sighting.
create or replace function public.create_sighting_if_active(
  target_id uuid,
  target_pet uuid,
  target_reporter uuid,
  target_message text,
  target_place text
)
returns table(created boolean, owner_id uuid)
language plpgsql
security definer
set search_path = public
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

  insert into public.sightings(id, pet_id, reporter_id, message, place)
  values(target_id, target_pet, target_reporter, target_message, target_place)
  on conflict (id) do nothing;

  created := found;
  owner_id := pet_owner;
  return next;
end;
$$;
revoke all on function public.create_sighting_if_active(uuid,uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.create_sighting_if_active(uuid,uuid,uuid,text,text) to service_role;

-- 4) Appointment slot invariant. Abort if live data is already ambiguous;
-- never silently delete or choose a winner during a production migration.
do $$
begin
  if exists (
    select 1
    from public.appointments
    where status <> 'cancelled'
    group by clinic_id, date, time_slot
    having count(*) > 1
  ) then
    raise exception 'RACE_HARDENING_ABORT: duplicate active appointment slots exist';
  end if;
end $$;
create unique index if not exists appointments_active_slot_unique
  on public.appointments(clinic_id, date, time_slot)
  where status <> 'cancelled';

-- 5) Atomic photo replacement. Row locks make DELETE + INSERT one serialized
-- operation instead of two client requests that can interleave.
create or replace function public.replace_pet_photos(target_pet uuid, target_urls text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select created_by into owner_id from public.pets where id = target_pet for update;
  if owner_id is null then raise exception 'PET_NOT_FOUND'; end if;
  if auth.uid() is null or (owner_id <> auth.uid() and auth.uid() not in (select user_id from public.admins)) then
    raise exception 'FORBIDDEN';
  end if;
  if coalesce(array_length(target_urls, 1), 0) > 4 then raise exception 'TOO_MANY_PHOTOS'; end if;

  delete from public.pet_photos where pet_id = target_pet;
  insert into public.pet_photos(pet_id, url, position)
  select target_pet, u.url, (u.ord - 1)::smallint
  from unnest(coalesce(target_urls, array[]::text[])) with ordinality as u(url, ord)
  where nullif(trim(u.url), '') is not null and u.ord <= 4;
end;
$$;
revoke all on function public.replace_pet_photos(uuid,text[]) from public;
grant execute on function public.replace_pet_photos(uuid,text[]) to authenticated;

create or replace function public.replace_adoption_photos(target_adoption uuid, target_urls text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select created_by into owner_id from public.adoptions where id = target_adoption for update;
  if owner_id is null then raise exception 'ADOPTION_NOT_FOUND'; end if;
  if auth.uid() is null or (owner_id <> auth.uid() and auth.uid() not in (select user_id from public.admins)) then
    raise exception 'FORBIDDEN';
  end if;
  if coalesce(array_length(target_urls, 1), 0) > 4 then raise exception 'TOO_MANY_PHOTOS'; end if;

  delete from public.adoption_photos where adoption_id = target_adoption;
  insert into public.adoption_photos(adoption_id, url, position)
  select target_adoption, u.url, (u.ord - 1)::smallint
  from unnest(coalesce(target_urls, array[]::text[])) with ordinality as u(url, ord)
  where nullif(trim(u.url), '') is not null and u.ord <= 4;
end;
$$;
revoke all on function public.replace_adoption_photos(uuid,text[]) from public;
grant execute on function public.replace_adoption_photos(uuid,text[]) to authenticated;

-- 6) Donation invoice claim. One logical donation gets one irreversible claim
-- before the external QPay side effect. We intentionally do not auto-expire
-- this claim: a crash may require manual recovery, but cannot create two invoices.
alter table public.donations add column if not exists invoice_claim_token uuid;
alter table public.donations add column if not exists invoice_claimed_at timestamptz;
create unique index if not exists donations_invoice_claim_token_unique
  on public.donations(invoice_claim_token)
  where invoice_claim_token is not null;

create or replace function public.claim_donation_invoice(target_id uuid, target_claim uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean := false;
begin
  update public.donations
  set invoice_claim_token = target_claim,
      invoice_claimed_at = now()
  where id = target_id
    and invoice_id is null
    and invoice_claim_token is null;
  claimed := found;
  return claimed;
end;
$$;
revoke all on function public.claim_donation_invoice(uuid,uuid) from public, anon, authenticated;
grant execute on function public.claim_donation_invoice(uuid,uuid) to service_role;

-- 7) Cron reminder claims. Multiple workers can run together, but FOR UPDATE
-- SKIP LOCKED + claim_date ensures each due row is emitted at most once per day.
alter table public.my_pets add column if not exists reminder_claim_date date;
alter table public.medications add column if not exists reminder_claim_date date;

create or replace function public.claim_due_vaccine_reminders(max_rows integer default 100)
returns table(id uuid, user_id uuid, name text, next_vaccine_date date, last_notified_date date)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select p.id
    from public.my_pets p
    where p.next_vaccine_date is not null
      and p.next_vaccine_date <= current_date
      and (p.last_notified_date is null or p.last_notified_date < current_date)
      and (p.reminder_claim_date is null or p.reminder_claim_date < current_date)
    order by p.id
    for update skip locked
    limit greatest(1, least(max_rows, 500))
  ), claimed as (
    update public.my_pets p
    set reminder_claim_date = current_date
    from candidates c
    where p.id = c.id
    returning p.id, p.user_id, p.name, p.next_vaccine_date, p.last_notified_date
  )
  select * from claimed order by id;
end;
$$;
revoke all on function public.claim_due_vaccine_reminders(integer) from public, anon, authenticated;
grant execute on function public.claim_due_vaccine_reminders(integer) to service_role;

create or replace function public.claim_due_medication_reminders(max_rows integer default 100)
returns table(id uuid, user_id uuid, pet_name text, name text, dosage text, next_reminder_date date, last_notified_date date)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select m.id
    from public.medications m
    where m.next_reminder_date is not null
      and m.next_reminder_date <= current_date
      and (m.last_notified_date is null or m.last_notified_date < current_date)
      and (m.reminder_claim_date is null or m.reminder_claim_date < current_date)
    order by m.id
    for update skip locked
    limit greatest(1, least(max_rows, 500))
  ), claimed as (
    update public.medications m
    set reminder_claim_date = current_date
    from candidates c
    where m.id = c.id
    returning m.id, m.pet_id, m.name, m.dosage, m.next_reminder_date, m.last_notified_date
  )
  select c.id, p.user_id, p.name, c.name, c.dosage, c.next_reminder_date, c.last_notified_date
  from claimed c
  join public.my_pets p on p.id = c.pet_id
  order by c.id;
end;
$$;
revoke all on function public.claim_due_medication_reminders(integer) from public, anon, authenticated;
grant execute on function public.claim_due_medication_reminders(integer) to service_role;

notify pgrst, 'reload schema';
commit;
