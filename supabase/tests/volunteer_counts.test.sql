begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();

select ok(not (select prosecdef from pg_proc where oid='public.get_volunteer_count(text)'::regprocedure), 'count RPC uses caller RLS, not definer privileges');
select ok(has_function_privilege('anon','public.get_volunteer_count(text)','EXECUTE'),'guests can request the public aggregate');
select ok(has_function_privilege('authenticated','public.get_volunteer_count(text)','EXECUTE'),'signed-in users can request the aggregate');
select ok(to_regclass('public.volunteers_district_count_idx') is not null,'district count has a leading district index');

create temp table count_baseline as select
  count(*) filter(where district='Баянзүрх')::bigint as bayan,
  count(*) filter(where district='Хан-Уул')::bigint as khan
from public.volunteers;
grant select on count_baseline to anon,authenticated;
insert into auth.users(id,email) select md5('volunteer-count-'||n)::uuid,'volunteer-count-'||n||'@example.invalid' from generate_series(1,1005) n;
insert into public.volunteers(user_id,district) select md5('volunteer-count-'||n)::uuid,case when n<=1002 then 'Баянзүрх' else 'Хан-Уул' end from generate_series(1,1005) n;

set local role anon;
select is(public.get_volunteer_count('Баянзүрх'),(select bayan+1002 from pg_temp.count_baseline),'COUNT includes more than the API 1000-row limit');
select is(public.get_volunteer_count('Хан-Уул'),(select khan+3 from pg_temp.count_baseline),'other districts are counted separately');
select is(public.get_volunteer_count('unknown-volunteer-count-test'),0::bigint,'empty district has a real zero');
select is(public.get_volunteer_count(null),0::bigint,'null input does not disclose all volunteers');
set local role authenticated;
do $$begin perform set_config('request.jwt.claim.sub',md5('volunteer-count-1'),true); end$$;
select is(public.get_volunteer_count('Баянзүрх'),(select bayan+1002 from pg_temp.count_baseline),'authenticated aggregate has the same public count');
delete from public.volunteers where user_id=auth.uid() and district='Баянзүрх';
select is(public.get_volunteer_count('Баянзүрх'),(select bayan+1001 from pg_temp.count_baseline),'count reflects a committed-in-transaction membership change');
delete from public.volunteers where user_id=md5('volunteer-count-2')::uuid;
select is((select count(*)::bigint from public.volunteers where user_id=md5('volunteer-count-2')::uuid),1::bigint,'another account cannot remove a volunteer membership');
reset role;
select * from finish();
rollback;
