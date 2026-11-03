-- МӨР Admin v2 upgrade
-- Supabase Dashboard → SQL Editor дээр бүхэлд нь нэг удаа ажиллуулна.
-- Дахин ажиллуулахад алдаа өгөхгүй.

-- Admin хийсэн чухал үйлдлийн мөр. Нууц auth мэдээлэл хадгалахгүй.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (char_length(action) between 1 and 80),
  target_type text not null check (char_length(target_type) between 1 and 40),
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Хүснэгт өмнө нь өөр schema-тай үүссэн бол CREATE TABLE IF NOT EXISTS
-- дутуу баганыг нэмдэггүй. Доорх ALTER-ууд хуучин хувилбарыг эвдэхгүй шинэчилнэ.
alter table public.admin_audit_logs add column if not exists id uuid default gen_random_uuid();
alter table public.admin_audit_logs add column if not exists admin_id uuid references auth.users(id) on delete restrict;
alter table public.admin_audit_logs add column if not exists action text not null default 'legacy';
alter table public.admin_audit_logs add column if not exists target_type text not null default 'unknown';
alter table public.admin_audit_logs add column if not exists target_id uuid;
alter table public.admin_audit_logs add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.admin_audit_logs add column if not exists created_at timestamptz not null default now();

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs"
  on public.admin_audit_logs for select to authenticated
  using (auth.uid() in (select user_id from public.admins));

drop policy if exists "Admins can create audit logs" on public.admin_audit_logs;
create policy "Admins can create audit logs"
  on public.admin_audit_logs for insert to authenticated
  with check (
    auth.uid() = admin_id
    and auth.uid() in (select user_id from public.admins)
  );

-- Audit log-ийг client/admin ч устгаж, засаж болохгүй.
create index if not exists admin_audit_created_idx
  on public.admin_audit_logs (created_at desc);

-- PostgREST-д шинэ багануудыг шууд таниулна.
notify pgrst, 'reload schema';

-- Admin аль ч асрах зарыг устгах эрх (өмнө нь дутуу байсан).
drop policy if exists "Admins can delete any sitting listing" on public.sitting_listings;
create policy "Admins can delete any sitting listing"
  on public.sitting_listings for delete to authenticated
  using (auth.uid() in (select user_id from public.admins));

-- Асрах зарын хуучин trigger байхгүй title багана шалгаж байсныг засна.
create or replace function public.validate_sitting_input()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.phone is not null and new.phone <> '' then
    if regexp_replace(new.phone, '\D', '', 'g') !~ '^(976)?[0-9]{8}$' then
      raise exception 'Утасны дугаар 8 оронтой тоо байх ёстой';
    end if;
  end if;
  if new.description is not null and char_length(new.description) > 2000 then
    raise exception 'Тайлбар хэт урт байна (хамгийн ихдээ 2000 тэмдэгт)';
  end if;
  if new.place is not null and char_length(new.place) > 500 then
    raise exception 'Байршил хэт урт байна (хамгийн ихдээ 500 тэмдэгт)';
  end if;
  if new.experience is not null and char_length(new.experience) > 500 then
    raise exception 'Туршлагын мэдээлэл хэт урт байна (хамгийн ихдээ 500 тэмдэгт)';
  end if;
  if new.availability is not null and char_length(new.availability) > 500 then
    raise exception 'Цагийн мэдээлэл хэт урт байна (хамгийн ихдээ 500 тэмдэгт)';
  end if;
  if new.price is not null and (new.price < 0 or new.price > 100000000) then
    raise exception 'Үнийн дүн буруу байна';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_sitting_input on public.sitting_listings;
create trigger trg_validate_sitting_input
  before insert or update on public.sitting_listings
  for each row execute function public.validate_sitting_input();
