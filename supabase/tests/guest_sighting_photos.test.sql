begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

select ok(exists (select 1 from storage.buckets
  where id='guest-sighting-photos' and not public and file_size_limit=3145728 and allowed_mime_types=array['image/jpeg']),
  'guest attachments use a private, bounded JPEG bucket');
select ok(not has_function_privilege('anon','public.submit_guest_sighting(uuid,uuid,text,text,double precision,double precision,timestamptz,text)','EXECUTE')
  and not has_function_privilege('authenticated','public.read_guest_sighting_photo(uuid,uuid,uuid)','EXECUTE'),
  'browser roles cannot call attachment RPCs');

insert into auth.users(id,email) values
  ('68000000-0000-4000-8000-000000000001','guest-photo-owner@example.invalid'),
  ('68000000-0000-4000-8000-000000000002','guest-photo-other@example.invalid');
insert into public.pets(id,status,type,created_by)
values ('68000000-0000-4000-8000-000000000003','lost','Муур','68000000-0000-4000-8000-000000000001');

create temporary view guest_photo_fixture as
select '68000000-0000-4000-8000-000000000003'::uuid as pet_id,
  '68000000-0000-4000-8000-000000000004'::uuid as submission_key,
  '68000000-0000-4000-8000-000000000004/68000000-0000-4000-8000-000000000005/' || repeat('a',64) || '.jpg' as photo_path,
  '68000000-0000-4000-8000-000000000004/68000000-0000-4000-8000-000000000006/' || repeat('a',64) || '.jpg' as retry_path;

select throws_ok($$select public.submit_guest_sighting(submission_key, pet_id, 'Seen', null, null, null, null, photo_path)
  from guest_photo_fixture$$, 'P0001', 'SIGHTING_PHOTO_MISSING', 'an attachment must exist in private storage');
insert into storage.objects(bucket_id,name)
select 'guest-sighting-photos', photo_path from guest_photo_fixture
union all
select 'guest-sighting-photos', retry_path from guest_photo_fixture;
select is((select public.submit_guest_sighting(submission_key,pet_id,'Seen',null,null,null,null,photo_path) from guest_photo_fixture),
  'created', 'one attachment can be submitted');
select is((select public.submit_guest_sighting(submission_key,pet_id,'Seen',null,null,null,null,retry_path) from guest_photo_fixture),
  'duplicate', 'a retry with identical content does not replace the original');

create temporary view guest_photo_report as
select g.id, g.pet_id, g.photo_path from public.guest_sightings g join guest_photo_fixture f using (submission_key);

select is((select public.read_guest_sighting_photo(pet_id,id,'68000000-0000-4000-8000-000000000001') from guest_photo_report),
  (select photo_path from guest_photo_fixture), 'verified owner can retrieve the original attachment');
select is((select public.read_guest_sighting_photo(pet_id,id,'68000000-0000-4000-8000-000000000002') from guest_photo_report),
  null::text, 'other users cannot retrieve the attachment');
set local role authenticated;
select is((select count(*) from storage.objects where bucket_id='guest-sighting-photos'), 0::bigint,
  'an authenticated browser cannot read private storage objects');
reset role;

select public.review_guest_sighting(pet_id,id,'68000000-0000-4000-8000-000000000001','publish') from guest_photo_report;
select ok((select s.guest_report and s.photo_path is null from public.sightings s join guest_photo_report g using (id)),
  'approving a summary never publishes a private photo');

delete from public.pets where id='68000000-0000-4000-8000-000000000003';
select is((select payload->>'guestSightingPhotoPath' from public.background_jobs where dedupe_key='guest-sighting-delete:68000000-0000-4000-8000-000000000005'),
  (select photo_path from guest_photo_fixture), 'deleting the listing queues removal of the private object');

select * from finish();
rollback;
