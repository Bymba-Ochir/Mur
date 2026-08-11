-- supabase-setup.sql
-- Энэ файлыг Supabase Dashboard → SQL Editor → New query дотор бүхэлд нь
-- хуулж, "Run" дарж ажиллуулна. Дахин ажиллуулахад ч алдаа гарахгүй (аюулгүй).

-- 1. Хүснэгт үүсгэх
create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('lost', 'found')),
  name text default '',
  type text not null,
  breed text default '',
  color text default '',
  place text default '',
  district text default '',
  phone text default '',
  has_reward boolean not null default false,
  reward integer,
  photo_url text,
  photo_urls jsonb not null default '[]'::jsonb,
  color_signature jsonb,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

-- Хуучин төсөлд lat/lng багана байхгүй бол нэмнэ (аюулгүй, дахин ажиллуулж болно)
alter table pets add column if not exists lat double precision;
alter table pets add column if not exists lng double precision;
alter table pets add column if not exists breed text default '';
alter table pets add column if not exists photo_urls jsonb not null default '[]'::jsonb;
-- AI matching v2 баганууд; бүрэн RPC/index-ийг supabase-ai-upgrade.sql үүсгэнэ.
create extension if not exists vector with schema extensions;
alter table pets add column if not exists image_embedding extensions.vector(512);
alter table pets add column if not exists dino_embedding extensions.vector(384);
alter table pets add column if not exists embedding_version text;
alter table pets add column if not exists image_hash text;

-- "Шагналтай" тэмдэг (нийтэд харагдана) + шагналын дүн (₮, НУУЦ — нийтэд харуулахгүй)
alter table pets add column if not exists has_reward boolean not null default false;
alter table pets add column if not exists reward integer;

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

-- 13b. Pet бичлэгийн өгөгдлийг DB түвшинд валидлах (клиентээр тойрч болохгүй)
-- Утасны дугаар 8 оронтой (эсвэл +976 угтвартай 11 оронтой) байх ёстой.
-- Хоосон утга нь хуучин/тест бичлэгүүдэд эвдрэл үүсгэхгүйн тулд зөвшөөрөгдөнө.
create or replace function validate_pet_input()
returns trigger
language plpgsql
as $$
begin
  if new.phone is not null and new.phone <> '' then
    if regexp_replace(new.phone, '\D', '', 'g') !~ '^(976)?[0-9]{8}$' then
      raise exception 'Утасны дугаар 8 оронтой тоо байх ёстой (жишээ: 99112233)';
    end if;
  end if;
  if new.name is not null and char_length(new.name) > 100 then
    raise exception 'Нэр хэт урт байна (хамгийн ихдээ 100 тэмдэгт)';
  end if;
  if new.color is not null and char_length(new.color) > 100 then
    raise exception 'Өнгө хэт урт байна (хамгийн ихдээ 100 тэмдэгт)';
  end if;
  if new.place is not null and char_length(new.place) > 500 then
    raise exception 'Байршил хэт урт байна (хамгийн ихдээ 500 тэмдэгт)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_pet_input on pets;
create trigger trg_validate_pet_input
  before insert or update on pets
  for each row execute function validate_pet_input();

-- 14. "Би харсан" сэтгэгдэл — олон нийт хамтдаа хайлтад тусалдаг
create table if not exists sightings (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  message text not null,
  place text,
  created_at timestamptz default now()
);

alter table sightings enable row level security;

drop policy if exists "Public read sightings" on sightings;
create policy "Public read sightings"
  on sightings for select
  using (true);

drop policy if exists "Anyone can add sighting" on sightings;
create policy "Anyone can add sighting"
  on sightings for insert
  with check (true);

-- 15. Сайн дурын идэвхтэн — тухайн дүүрэгт идэвхтэй хайлтад туслахаар бүртгүүлсэн хэрэглэгч
create table if not exists volunteers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  district text not null,
  created_at timestamptz default now(),
  unique (user_id, district)
);

alter table volunteers enable row level security;

-- Тоог нийтэд харуулах зорилгоор select нээлттэй (зөвхөн district+id, PII биш)
drop policy if exists "Public read volunteers" on volunteers;
create policy "Public read volunteers"
  on volunteers for select
  using (true);

drop policy if exists "Users manage own volunteer status" on volunteers;
create policy "Users manage own volunteer status"
  on volunteers for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 16. Хандив (QPay) — донор нэр/мессеж, төлбөрийн статус
create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  amount integer not null,
  supporter_name text,
  message text,
  is_anonymous boolean default false,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  invoice_id text,
  qr_image text,
  qr_text text,
  status_token text not null,
  created_at timestamptz default now()
);

alter table donations enable row level security;

-- Хэн ч хандив үүсгэж болно (нэвтрэлт шаардахгүй)
drop policy if exists "Anyone can create donation" on donations;
create policy "Anyone can create donation"
  on donations for insert
  with check (true);

-- Зөвхөн серверийн код (service role) л унших/шинэчилнэ — status_token-оор
-- баталгаажуулалт хийдэг тул client-д нээлттэй select хэрэггүй
drop policy if exists "No public read donations" on donations;

-- Сүүлд төлсөн хандивуудыг нийтэд харуулах (нэр, мессеж, дүн — зөвхөн paid)
drop policy if exists "Public read paid donations" on donations;
create policy "Public read paid donations"
  on donations for select
  using (status = 'paid');

-- 21. Жагсаалтын order/шүүлтийн index-ууд (өгөгдөл өсөхөд хурд)
create index if not exists pets_created_at_idx on pets (created_at desc);
create index if not exists pets_district_created_idx on pets (district, created_at desc);
create index if not exists pets_phone_idx on pets (phone);
create index if not exists sightings_created_at_idx on sightings (created_at desc);
create index if not exists reports_created_at_idx on reports (created_at desc);

-- 22. Үрчлүүлэх (Pet Adoption) — гэр орон хайж буй амьтны зар
create table if not exists adoptions (
  id uuid primary key default gen_random_uuid(),
  name text default '',
  type text not null,
  age text default '',
  gender text default 'Тодорхойгүй' check (gender in ('Эрэгтэй', 'Эмэгтэй', 'Тодорхойгүй')),
  breed text default '',
  description text default '',
  district text default '',
  place text default '',
  phone text default '',
  photo_url text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);

alter table adoptions enable row level security;

-- Хэн ч уншиж болно (жагсаалт, дэлгэрэнгүй нээлттэй)
drop policy if exists "Public read adoptions" on adoptions;
create policy "Public read adoptions"
  on adoptions for select using (true);

-- Зөвхөн нэвтэрсэн хэрэглэгч шинэ зар үүсгэж болно
drop policy if exists "Authenticated users can insert adoptions" on adoptions;
create policy "Authenticated users can insert adoptions"
  on adoptions for insert to authenticated with check (true);

-- Зохиогч өөрийн зарыг засах боломжтой
drop policy if exists "Owner can update own adoption" on adoptions;
create policy "Owner can update own adoption"
  on adoptions for update to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Зохиогч өөрийн зарыг устгаж болно
drop policy if exists "Owner can delete own adoption" on adoptions;
create policy "Owner can delete own adoption"
  on adoptions for delete to authenticated
  using (auth.uid() = created_by);

-- Admin-ууд аль ч зарыг устгаж болно
drop policy if exists "Admins can delete any adoption" on adoptions;
create policy "Admins can delete any adoption"
  on adoptions for delete to authenticated
  using (auth.uid() in (select user_id from admins));

-- Spam хамгаалалт — нэг утасны дугаар 1цагт хэт олон зар нийтлэхээс сэргийлнэ
create or replace function check_adoption_rate_limit()
returns trigger
language plpgsql
security definer
as $$
declare recent_count int;
begin
  select count(*) into recent_count
  from adoptions
  where phone = new.phone
    and created_at > now() - interval '1 hour';

  if recent_count >= 5 then
    raise exception 'RATE_LIMIT: Хэт олон удаа зар нийтлээ. 1 цагийн дараа дахин оролдоно уу.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_adoption_rate_limit on adoptions;
create trigger trg_adoption_rate_limit
  before insert on adoptions
  for each row execute function check_adoption_rate_limit();

-- Мэдээллийн валидаци — утасны дугаар + уртын хязгаар
create or replace function validate_adoption_input()
returns trigger
language plpgsql
as $$
begin
  if new.phone is not null and new.phone <> '' then
    if regexp_replace(new.phone, '\D', '', 'g') !~ '^(976)?[0-9]{8}$' then
      raise exception 'Утасны дугаар 8 оронтой тоо байх ёстой (жишээ: 99112233)';
    end if;
  end if;
  if new.name is not null and char_length(new.name) > 100 then
    raise exception 'Нэр хэт урт байна (хамгийн ихдээ 100 тэмдэгт)';
  end if;
  if new.breed is not null and char_length(new.breed) > 100 then
    raise exception 'Үүлдэр хэт урт байна (хамгийн ихдээ 100 тэмдэгт)';
  end if;
  if new.age is not null and char_length(new.age) > 100 then
    raise exception 'Нас хэт урт байна (хамгийн ихдээ 100 тэмдэгт)';
  end if;
  if new.place is not null and char_length(new.place) > 500 then
    raise exception 'Байршил хэт урт байна (хамгийн ихдээ 500 тэмдэгт)';
  end if;
  if new.description is not null and char_length(new.description) > 2000 then
    raise exception 'Тайлбар хэт урт байна (хамгийн ихдээ 2000 тэмдэгт)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_adoption_input on adoptions;
create trigger trg_validate_adoption_input
  before insert or update on adoptions
  for each row execute function validate_adoption_input();

-- Жагсаалтын index-ууд
create index if not exists adoptions_created_at_idx on adoptions (created_at desc);
create index if not exists adoptions_district_created_idx on adoptions (district, created_at desc);

-- 23. Чат (Real-time messaging) — хэрэглэгчид амьтны эзэнтэй шууд холбогдох
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  initiator_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  initiator_email text not null,
  owner_email text not null,
  created_at timestamptz default now(),
  constraint conversations_no_self_chat check (initiator_id <> owner_id),
  constraint conversations_unique_initiator_per_pet unique (pet_id, initiator_id)
);

alter table conversations enable row level security;

-- Оролцогчид харилцааны жагсаалтыг уншиж болно
drop policy if exists "Participants can view conversations" on conversations;
create policy "Participants can view conversations"
  on conversations for select to authenticated
  using (initiator_id = auth.uid() or owner_id = auth.uid());

-- Эхлүүлэгч шинэ харилцаа үүсгэж болно (эзэн нь заавал pets.created_by байх ёстой)
drop policy if exists "Initiator can create conversation" on conversations;
create policy "Initiator can create conversation"
  on conversations for insert to authenticated
  with check (
    initiator_id = auth.uid()
    and owner_id = (select created_by from pets where id = pet_id)
    and initiator_id <> owner_id
  );

-- Харилцаа үүсгэхэд имэйлийг автоматаар нөхөх (auth.users унших боломжгүй)
create or replace function set_conversation_emails()
returns trigger
language plpgsql
security definer
as $$
begin
  select email into new.initiator_email from auth.users where id = new.initiator_id;
  select email into new.owner_email from auth.users where id = new.owner_id;
  return new;
end;
$$;

drop trigger if exists trg_set_conversation_emails on conversations;
create trigger trg_set_conversation_emails
  before insert on conversations
  for each row execute function set_conversation_emails();

-- Мессежүүд
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table messages enable row level security;

-- Оролцогчид мессежүүдийг уншиж болно
drop policy if exists "Participants can view messages" on messages;
create policy "Participants can view messages"
  on messages for select to authenticated
  using (exists (
    select 1 from conversations c
    where c.id = conversation_id
      and (c.initiator_id = auth.uid() or c.owner_id = auth.uid())
  ));

-- Оролцогчид мессеж илгээж болно
drop policy if exists "Participants can send messages" on messages;
create policy "Participants can send messages"
  on messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.initiator_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- Жагсаалтын index-ууд
create index if not exists conversations_participant_idx on conversations (initiator_id, created_at desc);
create index if not exists conversations_owner_idx on conversations (owner_id, created_at desc);
create index if not exists messages_conversation_created_idx on messages (conversation_id, created_at asc);

-- Realtime — зөвхөн messages INSERT идэвхжүүлэх
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and tablename = 'messages'
     )
  then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

-- 24. Pet Health (Эрүүл мэндийн хэсэг) ──────────────────────────────────────

-- my_pets — нэмэлт профайл талбарууд
alter table my_pets add column if not exists age text;
alter table my_pets add column if not exists breed text;
alter table my_pets add column if not exists weight numeric(5,2);
alter table my_pets add column if not exists next_vaccine_name text;

-- Вакцины түүх
create table if not exists vaccinations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references my_pets(id) on delete cascade,
  vaccine_name text not null,
  vaccination_date date not null,
  vet_name text,
  notes text,
  created_at timestamptz default now()
);

alter table vaccinations enable row level security;

drop policy if exists "Owners manage vaccinations" on vaccinations;
create policy "Owners manage vaccinations"
  on vaccinations for all to authenticated
  using (exists (select 1 from my_pets where id = pet_id and user_id = auth.uid()))
  with check (exists (select 1 from my_pets where id = pet_id and user_id = auth.uid()));

-- Өвчний мэдээлэл
create table if not exists medical_conditions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references my_pets(id) on delete cascade,
  condition_name text not null,
  diagnosis_date date,
  notes text,
  created_at timestamptz default now()
);

alter table medical_conditions enable row level security;

drop policy if exists "Owners manage medical conditions" on medical_conditions;
create policy "Owners manage medical conditions"
  on medical_conditions for all to authenticated
  using (exists (select 1 from my_pets where id = pet_id and user_id = auth.uid()))
  with check (exists (select 1 from my_pets where id = pet_id and user_id = auth.uid()));

-- Эмийн мэдээлэл + сануулга
create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references my_pets(id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  next_reminder_date date,
  last_notified_date date,
  created_at timestamptz default now()
);

alter table medications enable row level security;

drop policy if exists "Owners manage medications" on medications;
create policy "Owners manage medications"
  on medications for all to authenticated
  using (exists (select 1 from my_pets where id = pet_id and user_id = auth.uid()))
  with check (exists (select 1 from my_pets where id = pet_id and user_id = auth.uid()));

-- Indexes
create index if not exists vaccinations_pet_idx on vaccinations (pet_id);
create index if not exists medical_conditions_pet_idx on medical_conditions (pet_id);
create index if not exists medications_pet_idx on medications (pet_id);
create index if not exists medications_next_reminder_idx on medications (next_reminder_date);

-- 25. Мал эмнэлгийн цаг захиалга (appointment booking)
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  clinic_id text not null,
  pet_id uuid references my_pets(id) on delete set null,
  service text not null check (service in ('Үзлэг', 'Вакцин', 'Мэс засал', 'Шүд арчилгаа')),
  date date not null,
  time_slot text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

alter table appointments enable row level security;

drop policy if exists "Users manage own appointments" on appointments;
create policy "Users manage own appointments"
  on appointments for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (pet_id is null or exists (
      select 1 from my_pets where id = pet_id and user_id = auth.uid()
    ))
  );

create index if not exists appointments_user_date_idx on appointments (user_id, date desc);
create index if not exists appointments_clinic_date_idx on appointments (clinic_id, date);

-- 26. Асрах үйлчилгээ (Pet Sitting)
create table if not exists sitting_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_type text not null default 'Нохой' check (pet_type in ('Нохой', 'Муур', 'Бусад', 'Бүгд')),
  description text default '',
  district text default '',
  place text default '',
  experience text default '',
  availability text default '',
  phone text default '',
  price integer,
  photo_url text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

alter table sitting_listings add column if not exists lat double precision;
alter table sitting_listings add column if not exists lng double precision;

alter table sitting_listings enable row level security;

-- Хэн ч уншиж болно
drop policy if exists "Public read sitting_listings" on sitting_listings;
create policy "Public read sitting_listings"
  on sitting_listings for select using (true);

-- Нэвтэрсэн хэрэглэгч шинэ зар үүсгэж болно
drop policy if exists "Authenticated users can insert sitting" on sitting_listings;
create policy "Authenticated users can insert sitting"
  on sitting_listings for insert to authenticated with check (auth.uid() = user_id);

-- Зохиогч өөрийн зарыг засах боломжтой
drop policy if exists "Owner can update sitting" on sitting_listings;
create policy "Owner can update sitting"
  on sitting_listings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Зохиогч өөрийн зарыг устгаж болно
drop policy if exists "Owner can delete sitting" on sitting_listings;
create policy "Owner can delete sitting"
  on sitting_listings for delete to authenticated
  using (auth.uid() = user_id);

-- Spam хамгаалалт
create or replace function check_sitting_rate_limit()
returns trigger
language plpgsql
security definer
as $$
declare recent_count int;
begin
  select count(*) into recent_count
  from sitting_listings
  where user_id = new.user_id
    and created_at > now() - interval '1 hour';

  if recent_count >= 5 then
    raise exception 'RATE_LIMIT: Хэт олон зар нийтлээ. 1 цагийн дараа дахин оролдоно уу.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sitting_rate_limit on sitting_listings;
create trigger trg_sitting_rate_limit
  before insert on sitting_listings
  for each row execute function check_sitting_rate_limit();

-- Валидаци
create or replace function validate_sitting_input()
returns trigger
language plpgsql
as $$
begin
  if new.phone is not null and new.phone <> '' then
    if regexp_replace(new.phone, '\D', '', 'g') !~ '^(976)?[0-9]{8}$' then
      raise exception 'Утасны дугаар 8 оронтой тоо байх ёстой';
    end if;
  end if;
  if new.title is not null and char_length(new.title) > 200 then
    raise exception 'Гарчиг хэт урт байна (хамгийн ихдээ 200 тэмдэгт)';
  end if;
  if new.description is not null and char_length(new.description) > 2000 then
    raise exception 'Тайлбар хэт урт байна (хамгийн ихдээ 2000 тэмдэгт)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_sitting_input on sitting_listings;
create trigger trg_validate_sitting_input
  before insert or update on sitting_listings
  for each row execute function validate_sitting_input();

create index if not exists sitting_created_at_idx on sitting_listings (created_at desc);
create index if not exists sitting_district_idx on sitting_listings (district);
