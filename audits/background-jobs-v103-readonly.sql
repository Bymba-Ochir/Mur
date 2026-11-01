-- Read-only. Does NOT claim, enqueue, acknowledge, or send any job.
select 'queue RLS enabled' as invariant, relrowsecurity as passed
from pg_class where oid = 'public.background_jobs'::regclass
union all
select 'queue private', not (
  has_table_privilege('anon','public.background_jobs','SELECT,INSERT,UPDATE,DELETE')
  or has_table_privilege('authenticated','public.background_jobs','SELECT,INSERT,UPDATE,DELETE'))
union all
select 'queue RPCs service-only', bool_and(
  has_function_privilege('service_role',p.oid,'EXECUTE')
  and not has_function_privilege('anon',p.oid,'EXECUTE')
  and not has_function_privilege('authenticated',p.oid,'EXECUTE'))
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in
  ('enqueue_background_job','enqueue_nearby_notification','enqueue_sighting_notification',
   'claim_background_job','finish_background_job','referenced_listing_photo_urls')
union all
select 'all five outbox triggers enabled', count(*) = 5
from pg_trigger where not tgisinternal and tgenabled <> 'D' and tgname in
 ('sighting_background_job_v103','pet_cleanup_job_v103','adoption_cleanup_job_v103','sitting_cleanup_job_v103','avatar_cleanup_job_v103');

-- Payload/paths/user IDs/tokens are deliberately excluded from audit output.
select kind,status,count(*) as jobs,min(created_at) as oldest_created_at
from public.background_jobs group by kind,status order by kind,status;

select count(*) filter (where status = 'failed') as failed_jobs,
  count(*) filter (where status = 'running' and locked_until < now()) as expired_leases,
  count(*) filter (where status = 'pending' and available_at < now() - interval '10 minutes') as overdue_jobs
from public.background_jobs;

-- After scheduler setup, verify in Dashboard > Cron that mur-background-jobs-v103
-- is active every minute and HTTP invocations return 202 (not 401/404/429/503).
