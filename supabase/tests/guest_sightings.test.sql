begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(19);

select ok(not has_table_privilege('anon','public.guest_sightings','SELECT')
  and not has_table_privilege('authenticated','public.guest_sightings','SELECT'), 'private reports unavailable to browser roles');
select ok(not has_function_privilege('anon','public.submit_guest_sighting(uuid,uuid,text,text,double precision,double precision,timestamptz)','EXECUTE')
  and not has_function_privilege('authenticated','public.review_guest_sighting(uuid,uuid,uuid,text)','EXECUTE'), 'browser cannot call privileged report RPCs');

insert into auth.users(id,email) values
  ('67000000-0000-4000-8000-000000000001','guest-sighting-owner@example.invalid'),
  ('67000000-0000-4000-8000-000000000002','guest-sighting-other@example.invalid');
insert into public.pets(id,status,type,created_by)
values ('67000000-0000-4000-8000-000000000003','lost','Муур','67000000-0000-4000-8000-000000000001');

create temporary view guest_fixture as
select id, pet_id, created_at, first_viewed_at, useful_at, state
from public.guest_sightings where submission_key = '67000000-0000-4000-8000-000000000004';

select is(public.submit_guest_sighting('67000000-0000-4000-8000-000000000004',
  '67000000-0000-4000-8000-000000000003','Private note','Private address',47.91352,106.91231,'2026-01-01T12:34:56Z'),
  'created', 'guest report accepted without an auth user');
select is(public.submit_guest_sighting('67000000-0000-4000-8000-000000000004',
  '67000000-0000-4000-8000-000000000003','Private note','Private address',47.91352,106.91231,'2026-01-01T12:34:56Z'),
  'duplicate', 'same request can be retried without duplicate reports');
select is(public.submit_guest_sighting('67000000-0000-4000-8000-000000000004',
  '67000000-0000-4000-8000-000000000003','Altered note',null,null,null,null),
  'conflict', 'the same key cannot replace a previous report');
select is((select count(*) from public.sightings where pet_id=(select pet_id from guest_fixture)), 0::bigint, 'pending report has no public row');
select ok((select count(*) = 1 and bool_and(payload->>'guest' = 'true' and not (payload ? 'place'))
  from public.background_jobs where dedupe_key='sighting:' || (select id::text from guest_fixture)), 'queues one notification without private data');
select is((select count(*) from public.list_guest_sightings('67000000-0000-4000-8000-000000000003',
  '67000000-0000-4000-8000-000000000002',null,null)), 0::bigint, 'non-owner cannot list reports');
select is(public.review_guest_sighting((select pet_id from guest_fixture),(select id from guest_fixture),
  '67000000-0000-4000-8000-000000000002','publish'), null::jsonb, 'non-owner cannot publish or read');
select is(public.review_guest_sighting((select pet_id from guest_fixture),(select id from guest_fixture),
  '67000000-0000-4000-8000-000000000001','view')->>'place','Private address','owner can see exact details');
select ok((select first_viewed_at >= created_at from guest_fixture), 'first view measured on the server');
select is(public.review_guest_sighting((select pet_id from guest_fixture),(select id from guest_fixture),
  '67000000-0000-4000-8000-000000000001','view')->'first_viewed_at',
  (select to_jsonb(first_viewed_at) from guest_fixture), 'reopening does not reset the first view');
select ok(public.review_guest_sighting((select pet_id from guest_fixture),(select id from guest_fixture),
  '67000000-0000-4000-8000-000000000001','useful')->>'useful_at' is not null, 'owner can mark useful while private');
select is(public.review_guest_sighting((select pet_id from guest_fixture),(select id from guest_fixture),
  '67000000-0000-4000-8000-000000000001','publish')->>'state','published','owner can publish the summary');
select ok((select guest_report and message = 'Зочны мэдээлэл' and place is null and sighted_at is null
  and lat = 47.91 and lng = 106.91 from public.sightings where id=(select id from guest_fixture)),
  'public row contains only a label and rounded coordinates');
select is(public.review_guest_sighting((select pet_id from guest_fixture),(select id from guest_fixture),
  '67000000-0000-4000-8000-000000000001','hide')->>'state','hidden','owner can withdraw a published report');
select is((select count(*) from public.sightings where pet_id=(select pet_id from guest_fixture)), 0::bigint, 'hide removes public listing and map pin');

select throws_ok($$insert into public.sightings(pet_id,message) values
  ('67000000-0000-4000-8000-000000000003','No signed-in reporter')$$,
  'P0001','REPORTER_REQUIRED','ordinary report still requires a signed-in reporter');
select throws_ok($$insert into public.sightings(pet_id,message,guest_report) values
  ('67000000-0000-4000-8000-000000000003','Зочны мэдээлэл',true)$$,
  'P0001','GUEST_SIGHTING_REQUIRED','public guest summary must match a real private report');

select * from finish();
rollback;
