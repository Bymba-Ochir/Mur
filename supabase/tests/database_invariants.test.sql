begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(15);
select has_table('public','pets','pets table exists');
select has_table('public','pet_photos','normalized pet photos exist');
select has_table('public','adoption_photos','normalized adoption photos exist');
select has_table('public','vet_services','normalized service catalog exists');
select has_table('public','background_jobs','durable queue exists');
select hasnt_column('public','pets','photo_urls','legacy photo array removed');
select hasnt_column('public','pets','favorite_count','favorite aggregate remains normalized');
select ok((select relrowsecurity from pg_class where oid='public.background_jobs'::regclass),'queue RLS enabled');
select ok(not has_table_privilege('anon','public.background_jobs','SELECT,INSERT,UPDATE,DELETE'),'queue inaccessible to anonymous clients');
select ok(not has_function_privilege('authenticated','public.create_sighting_if_active(uuid,uuid,uuid,text,text)','EXECUTE'),'sighting RPC remains server-only');
select ok(has_function_privilege('service_role','public.consume_api_rate_limit(text,integer,integer)','EXECUTE'),'v102 distributed limits remain available');
select ok(not has_function_privilege('anon','public.consume_api_rate_limit(text,integer,integer)','EXECUTE'),'rate store remains private');
select is((select count(*)::integer from pg_trigger where not tgisinternal and tgenabled <> 'D' and tgname in
  ('sighting_background_job_v103','pet_cleanup_job_v103','adoption_cleanup_job_v103','sitting_cleanup_job_v103','avatar_cleanup_job_v103')),5,'all outbox triggers enabled');
select ok(exists(select 1 from pg_constraint where conrelid='public.sitting_bookings'::regclass and contype='x'),'sitting overlap exclusion remains enforced');
select case
  when to_regclass('cron.job') is null then pass('local database has no production background schedule')
  else is_empty(
    $$select 1 from cron.job where jobname = 'mur-background-jobs-v103'$$,
    'local database has no production background schedule'
  )
end;
select * from finish();
rollback;
