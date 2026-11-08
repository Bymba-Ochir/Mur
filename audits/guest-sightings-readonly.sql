-- Last 14 UTC days. Aggregate only; no notes, locations, or identifiers.
begin read only;

with reports as (
  select (created_at at time zone 'UTC')::date as day,
         count(*) as submitted,
         count(first_viewed_at) as viewed_by_owner,
         count(useful_at) as marked_useful,
         percentile_cont(0.5) within group (order by extract(epoch from first_viewed_at - created_at) / 60)
           filter (where first_viewed_at is not null) as median_minutes_to_first_view
  from public.guest_sightings
  where created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' - interval '13 days'
  group by 1
)
select coalesce(o.day, r.day) as utc_day,
       coalesce(o.opens, 0) as consented_form_opens,
       coalesce(r.submitted, 0) as submitted,
       coalesce(r.viewed_by_owner, 0) as viewed_by_owner,
       coalesce(r.marked_useful, 0) as marked_useful,
       round(r.median_minutes_to_first_view::numeric, 1) as median_minutes_to_first_view
from reports r full join public.guest_sighting_opens o using (day)
where coalesce(o.day, r.day) >= (now() at time zone 'UTC')::date - 13
order by utc_day desc;

rollback;
