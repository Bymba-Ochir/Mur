-- МӨР v96: core relational normalization
-- Purpose: remove repeating-group arrays / duplicated attributes from core tables.
-- Rollout order:
--   1) deploy the compatible application code from this release
--   2) run this SQL once in Supabase SQL Editor
-- The migration is re-runnable. Backfills are verified before legacy columns are dropped.

begin;

-- ── Listing photos: 1:N child tables instead of photo_url + photo_urls JSONB ──
create table if not exists public.pet_photos (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  url text not null check (char_length(url) between 1 and 2048),
  position smallint not null check (position between 0 and 3),
  created_at timestamptz not null default now(),
  unique (pet_id, position)
);
alter table public.pet_photos enable row level security;
drop policy if exists "Public read pet photos" on public.pet_photos;
create policy "Public read pet photos" on public.pet_photos for select using (
  exists (select 1 from public.pets p where p.id = pet_id)
);
drop policy if exists "Owners manage pet photos" on public.pet_photos;
create policy "Owners manage pet photos" on public.pet_photos for all to authenticated
  using (exists (
    select 1 from public.pets p
    where p.id = pet_id
      and (p.created_by = auth.uid() or auth.uid() in (select user_id from public.admins))
  ))
  with check (exists (
    select 1 from public.pets p
    where p.id = pet_id
      and (p.created_by = auth.uid() or auth.uid() in (select user_id from public.admins))
  ));

create table if not exists public.adoption_photos (
  id uuid primary key default gen_random_uuid(),
  adoption_id uuid not null references public.adoptions(id) on delete cascade,
  url text not null check (char_length(url) between 1 and 2048),
  position smallint not null check (position between 0 and 3),
  created_at timestamptz not null default now(),
  unique (adoption_id, position)
);
alter table public.adoption_photos enable row level security;
drop policy if exists "Public read adoption photos" on public.adoption_photos;
create policy "Public read adoption photos" on public.adoption_photos for select using (
  exists (select 1 from public.adoptions a where a.id = adoption_id)
);
drop policy if exists "Owners manage adoption photos" on public.adoption_photos;
create policy "Owners manage adoption photos" on public.adoption_photos for all to authenticated
  using (exists (
    select 1 from public.adoptions a
    where a.id = adoption_id
      and (a.created_by = auth.uid() or auth.uid() in (select user_id from public.admins))
  ))
  with check (exists (
    select 1 from public.adoptions a
    where a.id = adoption_id
      and (a.created_by = auth.uid() or auth.uid() in (select user_id from public.admins))
  ));

-- Backfill pet photos from JSON array when present, then from legacy primary photo.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pets' and column_name='photo_urls'
  ) then
    execute $q$
      insert into public.pet_photos(pet_id, url, position)
      select p.id, item.url, (item.ord - 1)::smallint
      from public.pets p
      cross join lateral jsonb_array_elements_text(coalesce(p.photo_urls, '[]'::jsonb)) with ordinality item(url, ord)
      where item.ord <= 4 and nullif(trim(item.url), '') is not null
      on conflict (pet_id, position) do update set url = excluded.url
    $q$;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pets' and column_name='photo_url'
  ) then
    execute $q$
      insert into public.pet_photos(pet_id, url, position)
      select p.id, p.photo_url, 0
      from public.pets p
      where nullif(trim(p.photo_url), '') is not null
        and not exists (select 1 from public.pet_photos pp where pp.pet_id = p.id)
      on conflict (pet_id, position) do update set url = excluded.url
    $q$;
  end if;
end $$;

-- Backfill adoption photos.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='adoptions' and column_name='photo_urls'
  ) then
    execute $q$
      insert into public.adoption_photos(adoption_id, url, position)
      select a.id, item.url, (item.ord - 1)::smallint
      from public.adoptions a
      cross join lateral jsonb_array_elements_text(coalesce(a.photo_urls, '[]'::jsonb)) with ordinality item(url, ord)
      where item.ord <= 4 and nullif(trim(item.url), '') is not null
      on conflict (adoption_id, position) do update set url = excluded.url
    $q$;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='adoptions' and column_name='photo_url'
  ) then
    execute $q$
      insert into public.adoption_photos(adoption_id, url, position)
      select a.id, a.photo_url, 0
      from public.adoptions a
      where nullif(trim(a.photo_url), '') is not null
        and not exists (select 1 from public.adoption_photos ap where ap.adoption_id = a.id)
      on conflict (adoption_id, position) do update set url = excluded.url
    $q$;
  end if;
end $$;

-- Verify no legacy image would be lost before dropping the columns.
do $$
declare missing_count integer := 0;
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='pets' and column_name='photo_urls') then
    execute $q$
      select count(*)
      from public.pets p
      cross join lateral jsonb_array_elements_text(coalesce(p.photo_urls, '[]'::jsonb)) with ordinality item(url, ord)
      where item.ord <= 4
        and nullif(trim(item.url), '') is not null
        and not exists (select 1 from public.pet_photos pp where pp.pet_id=p.id and pp.url=item.url)
    $q$ into missing_count;
    if missing_count > 0 then raise exception 'NORMALIZATION_ABORT: % pet photos were not backfilled', missing_count; end if;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='adoptions' and column_name='photo_urls') then
    execute $q$
      select count(*)
      from public.adoptions a
      cross join lateral jsonb_array_elements_text(coalesce(a.photo_urls, '[]'::jsonb)) with ordinality item(url, ord)
      where item.ord <= 4
        and nullif(trim(item.url), '') is not null
        and not exists (select 1 from public.adoption_photos ap where ap.adoption_id=a.id and ap.url=item.url)
    $q$ into missing_count;
    if missing_count > 0 then raise exception 'NORMALIZATION_ABORT: % adoption photos were not backfilled', missing_count; end if;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='pets' and column_name='photo_url') then
    execute $q$
      select count(*) from public.pets p
      where nullif(trim(p.photo_url), '') is not null
        and not exists (select 1 from public.pet_photos pp where pp.pet_id=p.id and pp.url=p.photo_url)
    $q$ into missing_count;
    if missing_count > 0 then raise exception 'NORMALIZATION_ABORT: % pet primary photos were not backfilled', missing_count; end if;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='adoptions' and column_name='photo_url') then
    execute $q$
      select count(*) from public.adoptions a
      where nullif(trim(a.photo_url), '') is not null
        and not exists (select 1 from public.adoption_photos ap where ap.adoption_id=a.id and ap.url=a.photo_url)
    $q$ into missing_count;
    if missing_count > 0 then raise exception 'NORMALIZATION_ABORT: % adoption primary photos were not backfilled', missing_count; end if;
  end if;
end $$;

-- Old photo validation trigger/function are no longer needed after the 1:N move.
drop trigger if exists trg_validate_pet_photo_urls on public.pets;
drop function if exists public.validate_pet_photo_urls();
alter table public.pets drop column if exists photo_urls;
alter table public.pets drop column if exists photo_url;
alter table public.adoptions drop column if exists photo_urls;
alter table public.adoptions drop column if exists photo_url;

-- ── Vet services: service catalog + clinic join table instead of text[] ──────
create table if not exists public.vet_services (
  id text primary key,
  name_mn text not null unique,
  name_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.vet_services enable row level security;
drop policy if exists "Public read vet services" on public.vet_services;
create policy "Public read vet services" on public.vet_services for select using (is_active or auth.uid() in (select user_id from public.admins));
drop policy if exists "Admins manage vet services" on public.vet_services;
create policy "Admins manage vet services" on public.vet_services for all to authenticated
  using (auth.uid() in (select user_id from public.admins))
  with check (auth.uid() in (select user_id from public.admins));

insert into public.vet_services(id, name_mn, name_en) values
  ('exam','Үзлэг','Examination'),
  ('vaccine','Вакцин','Vaccination'),
  ('surgery','Мэс засал','Surgery'),
  ('dental','Шүд арчилгаа','Dental care'),
  ('xray','Рентген','X-ray'),
  ('ultrasound','ЭХО','Ultrasound'),
  ('blood-test','Цусны шинжилгээ','Blood test'),
  ('microchip','Микрочип','Microchip'),
  ('deworming','Туулгалт','Deworming'),
  ('grooming','Арчилгаа','Grooming')
on conflict (id) do update set name_mn=excluded.name_mn, name_en=excluded.name_en;

create table if not exists public.vet_clinic_services (
  clinic_id text not null references public.vet_clinics(id) on delete cascade,
  service_id text not null references public.vet_services(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (clinic_id, service_id)
);
create index if not exists vet_clinic_services_service_idx on public.vet_clinic_services(service_id, clinic_id);
alter table public.vet_clinic_services enable row level security;
drop policy if exists "Public read clinic services" on public.vet_clinic_services;
create policy "Public read clinic services" on public.vet_clinic_services for select using (
  exists (select 1 from public.vet_clinics c where c.id = clinic_id and (c.is_active or auth.uid() in (select user_id from public.admins)))
);
drop policy if exists "Admins manage clinic services" on public.vet_clinic_services;
create policy "Admins manage clinic services" on public.vet_clinic_services for all to authenticated
  using (auth.uid() in (select user_id from public.admins))
  with check (auth.uid() in (select user_id from public.admins));

-- Preserve any previously unknown service labels rather than discarding them.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='vet_clinics' and column_name='services') then
    execute $q$
      insert into public.vet_services(id, name_mn, name_en)
      select 'legacy-' || substr(md5(service_name), 1, 16), service_name, service_name
      from (
        select distinct unnest(coalesce(services, '{}'::text[])) as service_name
        from public.vet_clinics
      ) s
      where nullif(trim(service_name), '') is not null
        and not exists (select 1 from public.vet_services vs where vs.name_mn = service_name)
      on conflict (id) do nothing
    $q$;

    execute $q$
      insert into public.vet_clinic_services(clinic_id, service_id)
      select c.id, vs.id
      from public.vet_clinics c
      cross join lateral unnest(coalesce(c.services, '{}'::text[])) as svc(service_name)
      join public.vet_services vs on vs.name_mn = svc.service_name
      on conflict (clinic_id, service_id) do nothing
    $q$;
  end if;
end $$;

-- Appointments reference the service key, not a duplicated display label.
alter table public.appointments add column if not exists service_id text references public.vet_services(id) on delete restrict;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='appointments' and column_name='service') then
    execute $q$
      insert into public.vet_services(id, name_mn, name_en)
      select 'legacy-' || substr(md5(service), 1, 16), service, service
      from (select distinct service from public.appointments where service is not null and trim(service) <> '') a
      where not exists (select 1 from public.vet_services vs where vs.name_mn = a.service)
      on conflict (id) do nothing
    $q$;
    execute $q$
      update public.appointments a
      set service_id = vs.id
      from public.vet_services vs
      where a.service_id is null and vs.name_mn = a.service
    $q$;
  end if;
end $$;

do $$
begin
  if exists (select 1 from public.appointments where service_id is null) then
    raise exception 'NORMALIZATION_ABORT: appointments.service_id contains null values after backfill';
  end if;
end $$;
alter table public.appointments alter column service_id set not null;
alter table public.appointments drop column if exists service;
alter table public.vet_clinics drop column if exists services;

-- ── Conversations: participant names are derived from profiles, not copied ──
drop trigger if exists trg_set_conversation_emails on public.conversations;
drop function if exists public.set_conversation_emails();
alter table public.conversations drop column if exists initiator_email;
alter table public.conversations drop column if exists owner_email;

-- ── Favorites: pet_favorites is the source of truth; no stored count copy ────
create or replace function public.toggle_pet_favorite(target_pet uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare viewer uuid := auth.uid();
declare added boolean;
begin
  if viewer is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (select 1 from public.pets where id = target_pet) then raise exception 'PET_NOT_FOUND'; end if;
  delete from public.pet_favorites where user_id = viewer and pet_id = target_pet;
  if found then
    added := false;
  else
    insert into public.pet_favorites(user_id, pet_id) values(viewer, target_pet);
    added := true;
  end if;
  return added;
end; $$;
revoke all on function public.toggle_pet_favorite(uuid) from public;
grant execute on function public.toggle_pet_favorite(uuid) to authenticated;
alter table public.pets drop column if exists favorite_count;

notify pgrst, 'reload schema';
commit;
