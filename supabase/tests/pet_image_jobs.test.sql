begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(17);
select ok(not has_function_privilege('authenticated','public.claim_pet_image_job()','EXECUTE'), 'browser cannot claim image jobs');
select ok(not has_function_privilege('authenticated','public.complete_pet_image_embedding(uuid,uuid,real[],text)','EXECUTE'), 'browser cannot complete image jobs');
select ok(has_function_privilege('service_role','public.claim_pet_image_job()','EXECUTE'), 'worker can claim image jobs');
select ok(exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='sightings'), 'sightings realtime enabled');

-- Transaction-local fixtures do not affect existing jobs or application rows.
update public.background_jobs set available_at = now() + interval '1 day' where status = 'pending';
update public.background_jobs set locked_until = now() + interval '1 day' where status = 'running';
insert into auth.users(id,email) values ('40000000-0000-4000-8000-000000000001','image-tap@example.invalid');
insert into public.pets(id,status,type,created_by,embedding_photo_url,embedding_revision)
values ('40000000-0000-4000-8000-000000000002','lost','Муур','40000000-0000-4000-8000-000000000001',null,null);
insert into public.pet_photos(pet_id,url,position) values
('40000000-0000-4000-8000-000000000002','http://127.0.0.1:54321/storage/v1/object/public/pet-photos/40000000-0000-4000-8000-000000000001/lost/one.jpg',0);
set constraints all immediate;
select is((select count(*)::integer from public.background_jobs where kind='pet-image-embedding' and payload->>'petId'='40000000-0000-4000-8000-000000000002'),1,'photo commit queues exactly one image job');
select is((select count(*)::integer from public.claim_background_job()),0,'old worker leaves image jobs untouched');
create temporary table claimed as select * from public.claim_pet_image_job();
select is((select count(*)::integer from claimed),1,'image worker claims one row');
select is((select count(*)::integer from public.claim_pet_image_job()),0,'second worker cannot claim the active lease');
select throws_ok($$select public.complete_pet_image_embedding((select id from claimed),(select lease_token from claimed),array_fill(0::real,array[384]),repeat('a',64))$$,
  'P0001','INVALID_IMAGE_EMBEDDING','zero embedding is rejected');
select is(public.complete_pet_image_embedding((select id from claimed),gen_random_uuid(),array_prepend(1::real,array_fill(0::real,array[383])),repeat('a',64)),false,'wrong lease cannot write an embedding');
select is(public.complete_pet_image_embedding((select id from claimed),(select lease_token from claimed),array_prepend(1::real,array_fill(0::real,array[383])),repeat('a',64)),true,'current worker stores normalized vector');
select is((select embedding_version from public.pets where id='40000000-0000-4000-8000-000000000002'),'dinov2-small-q8-v1','embedding version matches browser search');
set constraints all deferred;
delete from public.pet_photos where pet_id='40000000-0000-4000-8000-000000000002';
insert into public.pet_photos(pet_id,url,position) values
('40000000-0000-4000-8000-000000000002','http://127.0.0.1:54321/storage/v1/object/public/pet-photos/40000000-0000-4000-8000-000000000001/lost/one.jpg',0);
set constraints all immediate;
select is((select count(*)::integer from public.background_jobs where kind='pet-image-embedding' and payload->>'petId'='40000000-0000-4000-8000-000000000002'),1,'same-photo atomic replacement preserves embedding and job');
update public.pet_photos set url='http://127.0.0.1:54321/storage/v1/object/public/pet-photos/40000000-0000-4000-8000-000000000001/lost/two.jpg'
where pet_id='40000000-0000-4000-8000-000000000002';
select ok((select dino_embedding is null from public.pets where id='40000000-0000-4000-8000-000000000002'),'new primary photo clears old vector');
select is(public.complete_pet_image_embedding((select id from claimed),(select lease_token from claimed),array_prepend(1::real,array_fill(0::real,array[383])),repeat('a',64)),false,'obsolete photo job cannot overwrite the new photo');
create temporary table provenance as select embedding_revision,embedding_photo_url from public.pets where id='40000000-0000-4000-8000-000000000002';
grant select on provenance to authenticated;
set local role authenticated;
set local "request.jwt.claim.sub" = '40000000-0000-4000-8000-000000000001';
update public.pets set embedding_revision=gen_random_uuid(), embedding_photo_url='https://attacker.invalid/photo'
where id='40000000-0000-4000-8000-000000000002';
select is((select embedding_revision from public.pets where id='40000000-0000-4000-8000-000000000002'),(select embedding_revision from provenance),'owner cannot forge server revision');
select is((select embedding_photo_url from public.pets where id='40000000-0000-4000-8000-000000000002'),(select embedding_photo_url from provenance),'owner cannot forge worker source URL');
reset role;
select * from finish();
rollback;
