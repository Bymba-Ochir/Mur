begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(11);

select ok(not has_function_privilege('anon','public.read_published_guest_sighting_photo(uuid,uuid)','EXECUTE')
  and not has_function_privilege('authenticated','public.review_guest_sighting_with_photo(uuid,uuid,uuid,text)','EXECUTE'),
  'storage paths and review actions are server-only');

insert into auth.users(id,email) values
  ('69000000-0000-4000-8000-000000000001','public-guest-owner@example.invalid'),
  ('69000000-0000-4000-8000-000000000002','public-guest-other@example.invalid');
insert into public.pets(id,status,type,created_by)
values ('69000000-0000-4000-8000-000000000003','lost','Муур','69000000-0000-4000-8000-000000000001');

create temporary view publication_fixture as
select '69000000-0000-4000-8000-000000000003'::uuid as pet_id,
  k as submission_key, k::text || '/69000000-0000-4000-8000-000000000009/' || repeat('a',64) || '.jpg' as path
from (values ('69000000-0000-4000-8000-000000000004'::uuid), ('69000000-0000-4000-8000-000000000005'::uuid)) keys(k);
insert into storage.objects(bucket_id,name)
select 'guest-sighting-photos', path from publication_fixture;
select public.submit_guest_sighting(submission_key,pet_id,'Private',null,null,null,null,path)
from publication_fixture where submission_key='69000000-0000-4000-8000-000000000004';

select is((select public.submit_guest_sighting_with_photo_consent(submission_key,pet_id,'Private',null,null,null,null,path,true)
  from publication_fixture where submission_key='69000000-0000-4000-8000-000000000004'),
  'conflict', 'a retry cannot change the consent on an older private report');
select is((select public.submit_guest_sighting_with_photo_consent(submission_key,pet_id,'Allowed',null,47.91523,106.92073,null,path,true)
  from publication_fixture where submission_key='69000000-0000-4000-8000-000000000005'),
  'created', 'guest can opt in when submitting an attachment');

create temporary view publication_report as select id, pet_id, submission_key from public.guest_sightings
where pet_id='69000000-0000-4000-8000-000000000003';
select throws_ok($$select public.review_guest_sighting_with_photo(pet_id,id,'69000000-0000-4000-8000-000000000001','publish_photo')
  from publication_report where submission_key='69000000-0000-4000-8000-000000000004'$$,
  'P0001','GUEST_PHOTO_CONSENT_REQUIRED','owner cannot publish an old private attachment');
select is((select public.review_guest_sighting_with_photo(pet_id,id,'69000000-0000-4000-8000-000000000002','publish_photo')
  from publication_report where submission_key='69000000-0000-4000-8000-000000000005'),
  null::jsonb,'another user cannot publish an opted-in photo');
select public.review_guest_sighting_with_photo(pet_id,id,'69000000-0000-4000-8000-000000000001','publish')
from publication_report where submission_key='69000000-0000-4000-8000-000000000005';
select is((select public.read_published_guest_sighting_photo(pet_id,id)
  from publication_report where submission_key='69000000-0000-4000-8000-000000000005'),
  null::text,'publishing a summary leaves the opted-in photo private');
select is((select public.review_guest_sighting_with_photo(pet_id,id,'69000000-0000-4000-8000-000000000001','publish_photo')->>'photoPublic'
  from publication_report where submission_key='69000000-0000-4000-8000-000000000005'),
  'true','owner can publish an opted-in photo later');
select is((select public.read_published_guest_sighting_photo(pet_id,id)
  from publication_report where submission_key='69000000-0000-4000-8000-000000000005'),
  (select path from publication_fixture where submission_key='69000000-0000-4000-8000-000000000005'),
  'public photo route resolves only the approved attachment');
select ok((select s.photo_path is null and s.lat=47.92 and s.lng=106.92 and s.message='Зочны мэдээлэл'
  from public.sightings s join publication_report g using(id) where g.submission_key='69000000-0000-4000-8000-000000000005'),
  'public feed still holds a rounded point and no storage path or private note');

select public.review_guest_sighting_with_photo(pet_id,id,'69000000-0000-4000-8000-000000000001','hide_photo')
from publication_report where submission_key='69000000-0000-4000-8000-000000000005';
select ok((select exists(select 1 from public.sightings s where s.id=g.id) and
  public.read_published_guest_sighting_photo(g.pet_id,g.id) is null from publication_report g
  where g.submission_key='69000000-0000-4000-8000-000000000005'),
  'withdrawing the photo keeps the approved summary');
select public.review_guest_sighting_with_photo(pet_id,id,'69000000-0000-4000-8000-000000000001','publish_photo')
from publication_report where submission_key='69000000-0000-4000-8000-000000000005';
select public.review_guest_sighting(pet_id,id,'69000000-0000-4000-8000-000000000001','hide')
from publication_report where submission_key='69000000-0000-4000-8000-000000000005';
select is((select public.read_published_guest_sighting_photo(pet_id,id)
  from publication_report where submission_key='69000000-0000-4000-8000-000000000005'),
  null::text,'hiding the report also withdraws access to the photo');

select * from finish();
rollback;
