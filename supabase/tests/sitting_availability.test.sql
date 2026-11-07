begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(3);

insert into auth.users(id,email) values ('53000000-0000-4000-8000-000000000001','sitting-availability@example.invalid');
insert into public.sitting_listings(id,user_id,description,district,place,availability)
values ('53000000-0000-4000-8000-000000000002','53000000-0000-4000-8000-000000000001','Pet care','Баянзүрх','22 хороо','Амралтын өдрүүдэд');

select ok((select available_from is null and not is_beginner and availability='Амралтын өдрүүдэд'
  from public.sitting_listings where id='53000000-0000-4000-8000-000000000002'), 'older clients can save free-text availability');

update public.sitting_listings
set available_from='2030-04-15 18:30:00+08', is_beginner=true
where id='53000000-0000-4000-8000-000000000002';
select ok((select is_beginner and available_from='2030-04-15 10:30:00+00'::timestamptz
  from public.sitting_listings where id='53000000-0000-4000-8000-000000000002'), 'stores experience flag and the exact availability instant');

select throws_like($$update public.sitting_listings set available_from='infinity' where id='53000000-0000-4000-8000-000000000002'$$,
  '%sitting_available_from_supported%', 'rejects timestamps that cannot be shown in the app');

select * from finish();
rollback;
