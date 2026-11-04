-- Counts only. Choose the pilot district and observation window in settings.
-- Report cohort uses publication time; resolution counts use the current report state.
begin transaction read only;

with settings as (
  select
    'Баянзүрх'::text as district,
    now() - interval '7 days' as start_at,
    now() as end_at
),
pilot_posts as (
  select p.id, p.status, p.resolved
  from public.pets p
  cross join settings w
  where p.district = w.district
    and p.created_at >= w.start_at
    and p.created_at < w.end_at
),
post_totals as (
  select
    count(*) filter (where status = 'lost') as lost_posts,
    count(*) filter (where status = 'found') as found_posts,
    count(*) filter (where status = 'lost' and resolved) as lost_marked_resolved,
    count(*) filter (where status = 'found' and resolved) as found_marked_resolved
  from pilot_posts
),
sighting_totals as (
  select count(*) as sightings
  from public.sightings s
  join pilot_posts p on p.id = s.pet_id
  cross join settings w
  where s.created_at >= w.start_at
    and s.created_at < w.end_at
)
select
  w.district,
  w.start_at at time zone 'Asia/Ulaanbaatar' as from_ub,
  w.end_at at time zone 'Asia/Ulaanbaatar' as to_ub,
  p.lost_posts,
  p.found_posts,
  s.sightings,
  p.lost_marked_resolved,
  p.found_marked_resolved
from settings w
cross join post_totals p
cross join sighting_totals s;

commit;
