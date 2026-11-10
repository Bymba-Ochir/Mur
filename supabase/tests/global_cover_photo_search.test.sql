begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(13);

select ok(not has_function_privilege('authenticated','public.save_pet_cover_fingerprint(uuid,uuid,text)','EXECUTE'), 'browser cannot write cover fingerprints');
select ok(not has_function_privilege('anon','public.queue_missing_pet_cover_fingerprints()','EXECUTE'), 'browser cannot enqueue the backfill');
update public.background_jobs set available_at = now() + interval '1 day' where status = 'pending';
update public.background_jobs set locked_until = now() + interval '1 day' where status = 'running';

insert into auth.users(id,email) values ('a6080000-0000-4000-8000-000000000001','cover-search@example.invalid');
-- The matching cover is older than one full listing page of newer rows.
insert into public.pets(id,status,type,name,created_by,created_at,is_hidden,resolved,archived_at)
select ('a6080000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid,
  'lost','Муур','Cover fixture ' || n,'a6080000-0000-4000-8000-000000000001',
  clock_timestamp() - n * interval '1 hour', n = 31, n = 32, case when n = 33 then now() end
from generate_series(2,33) n;
insert into public.pet_photos(pet_id,url,position)
select p.id,'http://127.0.0.1:54321/storage/v1/object/public/pet-photos/' || p.created_by || '/lost/' || p.id || '.jpg',0
from public.pets p where p.name in ('Cover fixture 30','Cover fixture 31','Cover fixture 32','Cover fixture 33');
set constraints all immediate;
create temporary table cover_job as select * from public.claim_pet_image_job();
-- The order of these jobs is immaterial to the search.
select is(public.save_pet_cover_fingerprint((select id from cover_job),(select lease_token from cover_job),repeat('1',64)), true, 'current lease can save a cover independently of inference');
select is(public.save_pet_cover_fingerprint((select id from cover_job),gen_random_uuid(),repeat('0',64)), false, 'wrong lease cannot replace a cover fingerprint');
update public.pets set cover_fingerprint=repeat('1',64)::bit(64)
where name in ('Cover fixture 30','Cover fixture 31','Cover fixture 32','Cover fixture 33');
set local role anon;
select results_eq(
  $$select id from public.match_pet_cover_ids(repeat('1',63) || '0', 'lost','Муур',null,'fixture')$$,
  $$values ('a6080000-0000-4000-8000-000000000030'::uuid)$$,
  'anonymous image search finds the older active listing and excludes hidden, resolved and archived covers'
);
select is((select count(*)::int from public.match_pet_cover_ids(repeat('1',64),'found',null,null,null)),0,'status filter still applies');
select is((select count(*)::int from public.match_pet_cover_ids('invalid',null,null,null,null)),0,'malformed fingerprints do not reach the bit operator');
reset role;

update public.pet_photos set url=url || '?replacement=1' where pet_id='a6080000-0000-4000-8000-000000000030';
select ok((select cover_fingerprint is null from public.pets where id='a6080000-0000-4000-8000-000000000030'),'changing cover invalidates the previous fingerprint');
update public.background_jobs set status='done', lease_token=null, locked_until=null, finished_at=clock_timestamp()
where dedupe_key='pet-image:' || (select embedding_revision::text from public.pets where id='a6080000-0000-4000-8000-000000000030');
do $$begin
  perform public.queue_missing_pet_cover_fingerprints();
  perform public.queue_missing_pet_cover_fingerprints();
end;$$;
select is((select count(*)::int from public.background_jobs where payload->>'petId'='a6080000-0000-4000-8000-000000000030' and payload->>'coverOnly'='false'),1,'backfill queues a missing vector only once');
set local role authenticated;
set local "request.jwt.claim.sub" = 'a6080000-0000-4000-8000-000000000001';
update public.pets set cover_fingerprint=repeat('1',64)::bit(64) where id='a6080000-0000-4000-8000-000000000030';
select ok((select cover_fingerprint is null from public.pets where id='a6080000-0000-4000-8000-000000000030'),'listing owner cannot forge a fingerprint');
reset role;
-- A legacy listing with a working vector but no bound source must recompute it.
update public.pets
set embedding_revision = null, embedding_photo_url = null,
    dino_embedding = array_prepend(1::real, array_fill(0::real, array[383]))::extensions.vector(384),
    embedding_version = 'dinov2-small-q8-v1'
where id = 'a6080000-0000-4000-8000-000000000030';
select public.queue_missing_pet_cover_fingerprints();
select is(
  (select j.payload->>'coverOnly' from public.background_jobs j join public.pets p
    on j.dedupe_key = 'pet-cover-v2:' || p.embedding_revision::text
    where p.id = 'a6080000-0000-4000-8000-000000000030'),
  'false',
  'rebinding the legacy cover queues a new vector'
);

-- The previous deployment may already have finished a cover-only job without a vector.
update public.pets set cover_fingerprint = repeat('1',64)::bit(64)
where id = 'a6080000-0000-4000-8000-000000000030';
insert into public.background_jobs(kind,dedupe_key,payload,status)
select 'pet-image-embedding', 'pet-cover:' || p.embedding_revision::text,
  jsonb_build_object('petId',p.id,'revision',p.embedding_revision,'coverOnly',true), 'done'
from public.pets p where p.id = 'a6080000-0000-4000-8000-000000000030';
delete from public.background_jobs j using public.pets p
where j.dedupe_key = 'pet-cover-v2:' || p.embedding_revision::text
  and p.id = 'a6080000-0000-4000-8000-000000000030';
select public.queue_missing_pet_cover_fingerprints();
select is(
  (select j.payload->>'coverOnly' from public.background_jobs j join public.pets p
    on j.dedupe_key = 'pet-cover-v2:' || p.embedding_revision::text
    where p.id = 'a6080000-0000-4000-8000-000000000030'),
  'false',
  'repairs a completed cover-only job that left the vector missing'
);

-- A current vector for the unchanged source is kept while only the hash is backfilled.
update public.pets set cover_fingerprint = null,
  dino_embedding = array_prepend(1::real, array_fill(0::real, array[383]))::extensions.vector(384),
  embedding_version = 'dinov2-small-q8-v1'
where id = 'a6080000-0000-4000-8000-000000000030';
delete from public.background_jobs j using public.pets p
where j.dedupe_key = 'pet-cover-v2:' || p.embedding_revision::text
  and p.id = 'a6080000-0000-4000-8000-000000000030';
select public.queue_missing_pet_cover_fingerprints();
select is(
  (select j.payload->>'coverOnly' from public.background_jobs j join public.pets p
    on j.dedupe_key = 'pet-cover-v2:' || p.embedding_revision::text
    where p.id = 'a6080000-0000-4000-8000-000000000030'),
  'true',
  'retains an existing current vector and queues only the fingerprint'
);

select * from finish();
rollback;
