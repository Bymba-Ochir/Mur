-- Requires supabase-workflows-v53.sql. Execute on staging first.
-- No records are deleted. Existing overlapping accepted bookings abort the transaction.
begin;
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set local search_path = public, extensions;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sitting_accepted_no_overlap' and conrelid = 'public.sitting_bookings'::regclass) then
    alter table public.sitting_bookings add constraint sitting_accepted_no_overlap
      exclude using gist (sitter_id with =, daterange(start_date, end_date, '[]') with &&)
      where (status = 'accepted');
  end if;
end $$;
create or replace function public.validate_booking_business_date()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.start_date < (current_timestamp at time zone 'Asia/Ulaanbaatar')::date then
    raise exception 'BOOKING_DATE_IN_PAST';
  end if;
  return new;
end $$;
drop trigger if exists trg_validate_booking_business_date on public.sitting_bookings;
create trigger trg_validate_booking_business_date before insert on public.sitting_bookings
for each row execute function public.validate_booking_business_date();
commit;
