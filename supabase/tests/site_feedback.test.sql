begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(10);
select ok((select relrowsecurity from pg_class where oid = 'public.site_feedback'::regclass), 'feedback has RLS');
select ok(not has_table_privilege('anon', 'public.site_feedback', 'SELECT,INSERT,UPDATE,DELETE'), 'anon has no direct access');
select ok(not has_table_privilege('authenticated', 'public.site_feedback', 'INSERT,UPDATE,DELETE'), 'authenticated has no write access');

insert into auth.users (id, email) values
  ('30000000-0000-4000-8000-000000000001', 'feedback-tap-user@example.invalid'),
  ('30000000-0000-4000-8000-000000000002', 'feedback-tap-admin@example.invalid');
insert into public.admins (user_id) values ('30000000-0000-4000-8000-000000000002');

set local role service_role;
select lives_ok($$insert into public.site_feedback (id, category, message, page)
  values ('30000000-0000-4000-8000-000000000003', 'suggestion', 'A test suggestion', '/pets')$$,
  'server can insert valid feedback');
select throws_ok($$insert into public.site_feedback (id, category, message, page)
  values ('30000000-0000-4000-8000-000000000003', 'suggestion', 'A test suggestion', '/pets')$$,
  '23505', null, 'database deduplicates the submission key');
select throws_ok($$insert into public.site_feedback (id, category, message, page)
  values ('30000000-0000-4000-8000-000000000004', 'invalid', 'A test suggestion', '/pets')$$,
  '23514', null, 'database enforces categories');
select throws_ok($$insert into public.site_feedback (id, category, message, page)
  values ('30000000-0000-4000-8000-000000000004', 'bug', 'A test suggestion', '/pets?private=1')$$,
  '23514', null, 'database rejects page query strings');

set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';
select is((select count(*)::integer from public.site_feedback), 0, 'non-admin cannot see feedback');
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000002';
select is((select message from public.site_feedback where id = '30000000-0000-4000-8000-000000000003'),
  'A test suggestion', 'admin can read feedback');
select throws_ok($$update public.site_feedback set message = 'Altered suggestion'$$,
  '42501', null, 'admin cannot edit submitted feedback');
reset role;

select * from finish();
rollback;
