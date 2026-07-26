-- supabase-setup.sql
-- Энэ файлыг Supabase Dashboard → SQL Editor → New query дотор бүхэлд нь
-- хуулж, "Run" дарж ажиллуулна. Дахин ажиллуулахад ч алдаа гарахгүй (аюулгүй).

-- 1. Хүснэгт үүсгэх
create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('lost', 'found')),
  name text default '',
  type text not null,
  color text default '',
  place text default '',
  district text default '',
  phone text default '',
  photo_url text,
  color_signature jsonb,
  created_at timestamptz default now()
);

-- 2. Row Level Security идэвхжүүлэх
alter table pets enable row level security;

-- 3. Хэн ч уншиж болно (жагсаалт, дэлгэрэнгүй нээлттэй)
drop policy if exists "Public read access" on pets;
create policy "Public read access"
  on pets for select
  using (true);

-- 4. Зөвхөн нэвтэрсэн хэрэглэгч шинэ бичлэг үүсгэж болно
drop policy if exists "Authenticated users can insert" on pets;
create policy "Authenticated users can insert"
  on pets for insert
  to authenticated
  with check (true);

-- 5. Storage bucket үүсгэх (зурган файлд зориулсан)
insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

-- 6. Storage-д хэн ч уншиж болно
drop policy if exists "Public photo read" on storage.objects;
create policy "Public photo read"
  on storage.objects for select
  using (bucket_id = 'pet-photos');

-- 7. Storage-д зөвхөн нэвтэрсэн хэрэглэгч зураг оруулж болно
drop policy if exists "Authenticated photo upload" on storage.objects;
create policy "Authenticated photo upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pet-photos');
