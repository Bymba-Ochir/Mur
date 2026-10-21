-- МӨР v98 browser trust hardening — READ ONLY verification
-- Mutation хийхгүй. Supabase SQL Editor дээр migration-ийн дараа ажиллуулна.

-- 1) pets/adoptions insert policy ownership-тэй таарч байгаа эсэх
select schemaname, tablename, policyname, cmd, roles, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('pets', 'adoptions')
  and cmd = 'INSERT'
order by tablename, policyname;

-- 2) pet-photos upload policy user-ийн өөрийн UUID folder-оор хязгаарлагдсан эсэх
select schemaname, tablename, policyname, cmd, roles, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and cmd = 'INSERT'
order by policyname;

-- 3) Server-only public mutation table-ууд anon/authenticated INSERT grant-гүй эсэх
select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('push_subscriptions', 'reports', 'sightings', 'donations')
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE')
order by table_name, grantee, privilege_type;
