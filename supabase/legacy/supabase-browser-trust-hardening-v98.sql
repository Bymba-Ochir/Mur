-- МӨР v98 — Browser trust hardening
-- Production дээр нэг удаа Supabase SQL Editor-оор ажиллуулна.
-- Өгөгдөл устгахгүй. Browser-аас ирсэн ownership/public write-ийг DB түвшинд хязгаарлана.

begin;

-- 1. Lost/found listing: browser created_by-г дурын UUID болгож болохгүй.
alter table public.pets alter column created_by set default auth.uid();
drop policy if exists "Authenticated users can insert" on public.pets;
create policy "Authenticated users can insert"
  on public.pets for insert to authenticated
  with check (auth.uid() = created_by);

-- 2. Adoption listing: ownership мөн server-authenticated user-тэй таарна.
alter table public.adoptions alter column created_by set default auth.uid();
drop policy if exists "Authenticated users can insert adoptions" on public.adoptions;
create policy "Authenticated users can insert adoptions"
  on public.adoptions for insert to authenticated
  with check (auth.uid() = created_by);

-- 3. Storage: хэрэглэгч зөвхөн өөрийн UUID root folder дотор зөвшөөрсөн зураг upload хийнэ.
drop policy if exists "Authenticated photo upload" on storage.objects;
drop policy if exists "Users upload own pet photos" on storage.objects;
create policy "Users upload own pet photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp')
  );

-- 4. Public mutation tables: direct browser write-ийг хааж server API/service role-оор л бичнэ.
drop policy if exists "Anyone can subscribe" on public.push_subscriptions;
drop policy if exists "Users insert push subscriptions" on public.push_subscriptions;
drop policy if exists "Users update push subscriptions" on public.push_subscriptions;
revoke insert, update on public.push_subscriptions from anon, authenticated;

drop policy if exists "Anyone can report" on public.reports;
drop policy if exists "Authenticated users can report" on public.reports;
revoke insert on public.reports from anon, authenticated;

drop policy if exists "Anyone can add sighting" on public.sightings;
drop policy if exists "Authenticated add sighting" on public.sightings;
revoke insert on public.sightings from anon, authenticated;

drop policy if exists "Anyone can create donation" on public.donations;
revoke insert on public.donations from anon, authenticated;

commit;

notify pgrst, 'reload schema';
