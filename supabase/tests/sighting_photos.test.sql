begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(7);

select ok(not has_function_privilege('authenticated','public.create_sighting_if_active(uuid,uuid,uuid,text,text,double precision,double precision,timestamptz,text)','EXECUTE'), 'browser cannot attach a stored image');
select ok(has_column_privilege('anon','public.sightings','photo_path','SELECT') and not has_column_privilege('anon','public.sightings','reporter_id','SELECT'), 'public photo path does not expose reporter ID');
select ok(exists(select 1 from storage.buckets where id='sighting-photos' and public and allowed_mime_types=array['image/jpeg']), 'sighting bucket accepts normalized JPEG');

insert into auth.users(id,email) values
  ('52000000-0000-4000-8000-000000000001','sighting-photo-owner@example.invalid'),
  ('52000000-0000-4000-8000-000000000002','sighting-photo-reporter@example.invalid');
insert into public.pets(id,status,type,created_by)
values ('52000000-0000-4000-8000-000000000003','lost','Муур','52000000-0000-4000-8000-000000000001');

select throws_ok($$select * from public.create_sighting_if_active('52000000-0000-4000-8000-000000000004','52000000-0000-4000-8000-000000000003','52000000-0000-4000-8000-000000000002','Seen',null,null,null,null,'missing.jpg')$$,
  'P0001','SIGHTING_PHOTO_MISSING','missing object cannot publish');
select is((select created from public.create_sighting_if_active('52000000-0000-4000-8000-000000000004','52000000-0000-4000-8000-000000000003','52000000-0000-4000-8000-000000000002','Seen',null,null,null,null)),true,'old RPC still publishes without an attachment');

update public.sightings
set photo_path=id::text || '/52000000-0000-4000-8000-000000000005/' || repeat('a',64) || '.jpg'
where id='52000000-0000-4000-8000-000000000004';

delete from auth.users where id='52000000-0000-4000-8000-000000000002';
select ok((select reporter_id is null and photo_path is null from public.sightings where id='52000000-0000-4000-8000-000000000004'), 'account removal detaches the public image');
select is((select payload->>'sightingPhotoPath' from public.background_jobs where dedupe_key='sighting-delete:52000000-0000-4000-8000-000000000005'),
  '52000000-0000-4000-8000-000000000004/52000000-0000-4000-8000-000000000005/' || repeat('a',64) || '.jpg', 'account removal queues cleanup of the old object');

select * from finish();
rollback;
