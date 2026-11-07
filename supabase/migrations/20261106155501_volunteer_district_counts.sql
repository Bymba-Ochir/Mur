-- PRE-DEPLOY: apply this new migration before code calling get_volunteer_count.
-- Aggregate only the requested district; no volunteer identities leave PostgreSQL.
begin;

create index if not exists volunteers_district_count_idx on public.volunteers (district);

create or replace function public.get_volunteer_count(target_district text)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*) from public.volunteers v where v.district = target_district;
$$;

revoke all on function public.get_volunteer_count(text) from public;
grant execute on function public.get_volunteer_count(text) to anon, authenticated, service_role;
comment on function public.get_volunteer_count(text) is 'District-only aggregate; respects the caller volunteer SELECT RLS and returns no identities.';
notify pgrst, 'reload schema';
commit;
