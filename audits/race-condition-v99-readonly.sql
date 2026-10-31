-- MUR v99 read-only race-condition audit
-- Expected: problem_count = 0 and all required functions/indexes present.

select 'duplicate_active_appointment_slots' as check_name, count(*) as problem_count
from (
  select clinic_id, date, time_slot
  from public.appointments
  where status <> 'cancelled'
  group by clinic_id, date, time_slot
  having count(*) > 1
) d;

select 'multiple_accepted_adoption_applications' as check_name, count(*) as problem_count
from (
  select adoption_id
  from public.adoption_applications
  where status = 'accepted'
  group by adoption_id
  having count(*) > 1
) d;

select 'overlapping_accepted_sitting_bookings' as check_name, count(*) as problem_count
from (
  select a.id
  from public.sitting_bookings a
  join public.sitting_bookings b
    on a.id < b.id
   and a.sitter_id = b.sitter_id
   and a.status = 'accepted'
   and b.status = 'accepted'
   and a.start_date <= b.end_date
   and b.start_date <= a.end_date
) d;

select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'transition_adoption_application',
    'transition_sitting_booking',
    'replace_pet_photos',
    'replace_adoption_photos',
    'claim_donation_invoice',
    'claim_due_vaccine_reminders',
    'claim_due_medication_reminders',
    'toggle_pet_favorite'
  )
order by p.proname;

select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in ('appointments_active_slot_unique','donations_invoice_claim_token_unique','adoption_application_one_accepted')
order by indexname;

select conname
from pg_constraint
where conname = 'sitting_no_overlapping_accepted';
