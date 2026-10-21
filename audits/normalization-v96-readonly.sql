-- MӨР v96 normalization verification (read-only).
-- Run after supabase-normalization-v96.sql. No rows are modified.

-- 1) Normalized relation tables must exist and RLS must be enabled.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('pet_photos', 'adoption_photos', 'vet_services', 'vet_clinic_services')
order by c.relname;

-- 2) Legacy repeating/duplicated columns should be gone.
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'pets' and column_name in ('photo_url', 'photo_urls', 'favorite_count'))
    or (table_name = 'adoptions' and column_name in ('photo_url', 'photo_urls'))
    or (table_name = 'vet_clinics' and column_name = 'services')
    or (table_name = 'appointments' and column_name = 'service')
    or (table_name = 'conversations' and column_name in ('initiator_email', 'owner_email'))
  )
order by table_name, column_name;

-- 3) Foreign-key integrity should return zero orphan rows.
select 'pet_photos_without_pet' as check_name, count(*) as problems
from public.pet_photos pp left join public.pets p on p.id = pp.pet_id where p.id is null
union all
select 'adoption_photos_without_adoption', count(*)
from public.adoption_photos ap left join public.adoptions a on a.id = ap.adoption_id where a.id is null
union all
select 'clinic_services_without_clinic', count(*)
from public.vet_clinic_services vcs left join public.vet_clinics c on c.id = vcs.clinic_id where c.id is null
union all
select 'clinic_services_without_service', count(*)
from public.vet_clinic_services vcs left join public.vet_services vs on vs.id = vcs.service_id where vs.id is null
union all
select 'appointments_without_service', count(*)
from public.appointments a left join public.vet_services vs on vs.id = a.service_id where vs.id is null;

-- 4) At most four ordered photos per listing; should return zero rows.
select pet_id as owner_id, count(*) as photo_count
from public.pet_photos
group by pet_id having count(*) > 4
union all
select adoption_id, count(*)
from public.adoption_photos
group by adoption_id having count(*) > 4;
