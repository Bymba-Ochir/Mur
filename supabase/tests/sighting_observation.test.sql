begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

select ok(not has_function_privilege('authenticated','public.create_sighting_if_active(uuid,uuid,uuid,text,text,double precision,double precision,timestamptz)','EXECUTE'), 'browser cannot call observation RPC');
select ok(has_column_privilege('anon','public.sightings','sighted_at','SELECT') and has_column_privilege('anon','public.sightings','lat','SELECT') and has_column_privilege('anon','public.sightings','lng','SELECT'), 'observation fields can be read publicly');
select ok(not has_column_privilege('anon','public.sightings','reporter_id','SELECT') and not has_table_privilege('authenticated','public.sightings','INSERT'), 'reporter remains private and browser cannot insert');

insert into auth.users(id,email) values
  ('51000000-0000-4000-8000-000000000001','sighting-owner@example.invalid'),
  ('51000000-0000-4000-8000-000000000002','sighting-reporter@example.invalid');
insert into public.pets(id,status,type,created_by)
values ('51000000-0000-4000-8000-000000000003','lost','Муур','51000000-0000-4000-8000-000000000001');

select is((select created from public.create_sighting_if_active('51000000-0000-4000-8000-000000000004','51000000-0000-4000-8000-000000000003','51000000-0000-4000-8000-000000000002','Seen','Park',47.91,106.91,'2025-01-01 12:00:00+08')), true, 'active sighting accepts both optional fields');
select is((select sighted_at from public.sightings where id='51000000-0000-4000-8000-000000000004'), '2025-01-01 04:00:00+00'::timestamptz, 'observed time represents the correct instant');
select ok((select lat=47.91 and lng=106.91 from public.sightings where id='51000000-0000-4000-8000-000000000004'), 'coordinate pair is saved');
select is((select created from public.create_sighting_if_active('51000000-0000-4000-8000-000000000004','51000000-0000-4000-8000-000000000003','51000000-0000-4000-8000-000000000002','Seen','Park',47.91,106.91,'2025-01-01 04:00:00+00')), false, 'same ID cannot create a duplicate');
select is((select count(*)::integer from public.background_jobs where dedupe_key='sighting:51000000-0000-4000-8000-000000000004'),1,'sighting still queues exactly one notification');
select is((select created from public.create_sighting_if_active('51000000-0000-4000-8000-000000000005','51000000-0000-4000-8000-000000000003','51000000-0000-4000-8000-000000000002','Seen',null)), true, 'old deployment can still publish');
select ok((select lat is null and lng is null and sighted_at is null from public.sightings where id='51000000-0000-4000-8000-000000000005'), 'absent metadata stays null');
select throws_like($$update public.sightings set lng=null where id='51000000-0000-4000-8000-000000000004'$$,'%sightings_coordinate_pair%','database rejects incomplete coordinate');
select throws_like($$update public.sightings set lat=91 where id='51000000-0000-4000-8000-000000000004'$$,'%sightings_coordinate_pair%','database rejects invalid latitude');
select throws_like($$update public.sightings set sighted_at=now()+interval '1 hour' where id='51000000-0000-4000-8000-000000000004'$$,'%sightings_observation_time%','database rejects future observation');

update public.pets set resolved=true where id='51000000-0000-4000-8000-000000000003';
select throws_ok($$select * from public.create_sighting_if_active('51000000-0000-4000-8000-000000000006','51000000-0000-4000-8000-000000000003','51000000-0000-4000-8000-000000000002','Seen',null,null,null,null)$$,'P0001','PET_NOT_ACTIVE','resolved pet still cannot receive sightings');
select * from finish();
rollback;
