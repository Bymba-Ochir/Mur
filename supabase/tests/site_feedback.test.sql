begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(18);
select ok((select relrowsecurity from pg_class where oid = 'public.site_feedback'::regclass), 'feedback has RLS');
select ok(not has_table_privilege('anon', 'public.site_feedback', 'SELECT,INSERT,UPDATE,DELETE'), 'anon has no direct access');
select ok(not has_table_privilege('authenticated', 'public.site_feedback', 'INSERT,UPDATE,DELETE'), 'authenticated has no write access');
select ok(not has_function_privilege('anon', 'public.admin_delete_feedback(uuid)', 'EXECUTE'), 'anon cannot call feedback deletion');
select ok(not has_function_privilege('service_role', 'public.admin_delete_feedback(uuid)', 'EXECUTE'), 'server key cannot call admin deletion');

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
select throws_ok($$select public.admin_delete_feedback('30000000-0000-4000-8000-000000000003')$$,
  '42501', 'ADMIN_REQUIRED', 'non-admin cannot delete feedback');
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000002';
select is((select message from public.site_feedback where id = '30000000-0000-4000-8000-000000000003'),
  'A test suggestion', 'admin can read feedback');
select throws_ok($$update public.site_feedback set message = 'Altered suggestion'$$,
  '42501', null, 'admin cannot edit submitted feedback');
select lives_ok($$select public.admin_delete_feedback('30000000-0000-4000-8000-000000000003')$$,
  'admin can delete feedback through the RPC');
select is((select count(*)::integer from public.site_feedback where id = '30000000-0000-4000-8000-000000000003'),
  0, 'deleted feedback is gone');
select is((select count(*)::integer from public.admin_audit_logs
  where action = 'delete' and target_type = 'site_feedback'
    and admin_id = '30000000-0000-4000-8000-000000000002'
    and target_id::text = '30000000-0000-4000-8000-000000000003'), 1, 'deletion is audited against the verified admin');
select lives_ok($$select public.admin_delete_feedback('30000000-0000-4000-8000-000000000003')$$,
  'retrying a successful delete is safe');
select is((select count(*)::integer from public.admin_audit_logs
  where action = 'delete' and target_type = 'site_feedback'
    and target_id::text = '30000000-0000-4000-8000-000000000003'), 1, 'retry does not duplicate the audit');
reset role;

select * from finish();
rollback;
