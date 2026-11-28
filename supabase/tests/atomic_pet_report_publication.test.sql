begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

insert into auth.users (id, email) values
  ('50000000-0000-4000-8000-000000000021', 'report-owner@example.invalid'),
  ('50000000-0000-4000-8000-000000000022', 'report-other@example.invalid');

select ok(not has_function_privilege('anon', 'public.publish_pet_report(uuid,jsonb,text[])', 'EXECUTE'),
  'anonymous visitors cannot publish');

set local role authenticated;
set local "request.jwt.claim.sub" = '50000000-0000-4000-8000-000000000021';
select throws_ok($$
  select publish_pet_report('50000000-0000-4000-8000-000000000023',
    '{"status":"lost","type":"Муур","district":"Хан-Уул","phone_hidden":true,"has_reward":false}',
    array['one','two','three','four','five'])
$$, 'P0001', 'TOO_MANY_PHOTOS', 'photo failure rolls back publication');

set local role anon;
select is((select count(*) from pets where id = '50000000-0000-4000-8000-000000000023'), 0::bigint,
  'visitors cannot see a report with a failed photo attachment');

set local role authenticated;
select is(publish_pet_report('50000000-0000-4000-8000-000000000023',
    '{"status":"lost","type":"Муур","district":"Хан-Уул","phone_hidden":true,"has_reward":false}',
    array['https://example.invalid/first.webp','https://example.invalid/second.webp']),
  '50000000-0000-4000-8000-000000000023'::uuid, 'retry publishes the original report ID');
select is(publish_pet_report('50000000-0000-4000-8000-000000000023',
    '{"name":"Different body"}', array['https://example.invalid/other.webp']),
  '50000000-0000-4000-8000-000000000023'::uuid, 'retry of a committed request returns its ID');

set local "request.jwt.claim.sub" = '50000000-0000-4000-8000-000000000022';
select throws_ok($$
  select publish_pet_report('50000000-0000-4000-8000-000000000023', '{}', array[]::text[])
$$, '23505', 'REPORT_ID_CONFLICT', 'another account cannot reuse the report ID');

set local role anon;
select is((select count(*) from pets where id = '50000000-0000-4000-8000-000000000023'), 1::bigint,
  'only one report becomes public');
select is((select array_agg(url order by position) from pet_photos where pet_id = '50000000-0000-4000-8000-000000000023'),
  array['https://example.invalid/first.webp','https://example.invalid/second.webp'], 'the report retains its original ordered photos');

select * from finish();
rollback;
