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
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

-- Хуучин төсөлд lat/lng багана байхгүй бол нэмнэ (аюулгүй, дахин ажиллуулж болно)
alter table pets add column if not exists lat double precision;
alter table pets add column if not exists lng double precision;

-- "Олдлоо" товч, зохиогчийг тэмдэглэх багана
alter table pets add column if not exists created_by uuid references auth.users(id);
alter table pets alter column created_by set default auth.uid();
alter table pets add column if not exists resolved boolean not null default false;

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

-- 5. Зохиогч өөрийн бичлэгээ засах боломжтой (жишээ нь "Олдлоо" гэж тэмдэглэх)
drop policy if exists "Owner can update own pet" on pets;
create policy "Owner can update own pet"
  on pets for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- 6. Storage bucket үүсгэх (зурган файлд зориулсан)
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

-- 8. Push мэдэгдэлд бүртгүүлсэн хэрэглэгчдийн хүснэгт (Nearby Alert)
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  district text not null,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

-- Хэн ч өөрийн дугаарлалтаа бүртгүүлж болно (нэвтрэх шаардлагагүй, зөвхөн browser push endpoint)
drop policy if exists "Anyone can subscribe" on push_subscriptions;
create policy "Anyone can subscribe"
  on push_subscriptions for insert
  with check (true);

-- 9. "Миний амьтад" — хэрэглэгчийн өөрийн бүртгэлтэй амьтад, вакцины хугацаа
create table if not exists my_pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  photo_url text,
  next_vaccine_date date,
  last_notified_date date,
  created_at timestamptz default now()
);

alter table my_pets enable row level security;

drop policy if exists "Users manage own pets" on my_pets;
create policy "Users manage own pets"
  on my_pets for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 10. push_subscriptions-д хэрэглэгчийн ID нэмнэ (вакцины сануулга хэрэглэгч
-- тус бүрт зориулагдсан байх ёстой, дүүргээр биш)
alter table push_subscriptions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table push_subscriptions alter column district drop not null;

-- 11. Буруу/spam/hoax бичлэгийг мэдээлэх (модерацид зориулсан)
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references pets(id) on delete cascade,
  reason text not null,
  created_at timestamptz default now()
);

alter table reports enable row level security;

drop policy if exists "Anyone can report" on reports;
create policy "Anyone can report"
  on reports for insert
  with check (true);

-- 12. Admin — модератор эрхтэй хэрэглэгчид
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table admins enable row level security;

-- Хэрэглэгч зөвхөн өөрийгөө admin эсэхийг шалгаж болно (UI-д харуулах/нуухад ашиглана)
drop policy if exists "Users can check own admin status" on admins;
create policy "Users can check own admin status"
  on admins for select
  to authenticated
  using (auth.uid() = user_id);

-- Admin-ууд reports хүснэгтийг унших, устгаж болно
drop policy if exists "Admins can read reports" on reports;
create policy "Admins can read reports"
  on reports for select
  to authenticated
  using (auth.uid() in (select user_id from admins));

drop policy if exists "Admins can delete reports" on reports;
create policy "Admins can delete reports"
  on reports for delete
  to authenticated
  using (auth.uid() in (select user_id from admins));

-- Admin-ууд аль ч pet бичлэгийг устгах/шинэчлэх боломжтой (зохиогчоос үл хамааран)
drop policy if exists "Admins can update any pet" on pets;
create policy "Admins can update any pet"
  on pets for update
  to authenticated
  using (auth.uid() in (select user_id from admins))
  with check (auth.uid() in (select user_id from admins));

drop policy if exists "Admins can delete any pet" on pets;
create policy "Admins can delete any pet"
  on pets for delete
  to authenticated
  using (auth.uid() in (select user_id from admins));

-- ЗААВАЛ: Өөрийгөө admin болгохын тулд SQL Editor-с дараах командыг ажиллуул
-- (имэйлээ солиод):
--   insert into admins (user_id)
--   select id from auth.users where email = 'таны@имэйл.com';

-- 13. Spam хамгаалалт — нэг утасны дугаар 1 цагт хэт олон удаа бичлэг нийтлэхээс сэргийлнэ
-- Клиент талаас тойрч болохгүй, өгөгдлийн сангийн түвшинд хэрэгждэг
create or replace function check_pet_rate_limit()
returns trigger
language plpgsql
security definer
as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from pets
  where phone = new.phone
    and created_at > now() - interval '1 hour';

  if recent_count >= 5 then
    raise exception 'RATE_LIMIT: Хэт олон удаа мэдээлэл илгээлээ. 1 цагийн дараа дахин оролдоно уу.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_pet_rate_limit on pets;
create trigger trg_pet_rate_limit
  before insert on pets
  for each row execute function check_pet_rate_limit();
