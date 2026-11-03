-- МӨР — Admin Center migration
-- Supabase Dashboard > SQL Editor дээр нэг удаа бүхэлд нь ажиллуулна.

-- ── Helpers ────────────────────────────────────────────────────────────────
create or replace function public.is_current_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admins where user_id = auth.uid()) $$;
revoke all on function public.is_current_admin() from public;
grant execute on function public.is_current_admin() to authenticated;

-- ── Moderation fields ─────────────────────────────────────────────────────
alter table public.pets add column if not exists is_hidden boolean not null default false;
alter table public.pets add column if not exists is_featured boolean not null default false;
alter table public.pets add column if not exists admin_note text;
alter table public.adoptions add column if not exists moderation_status text not null default 'approved'
  check (moderation_status in ('pending','approved','rejected','hidden','adopted'));
alter table public.adoptions add column if not exists admin_note text;
alter table public.sitting_listings add column if not exists moderation_status text not null default 'approved'
  check (moderation_status in ('pending','approved','rejected','hidden'));
alter table public.sitting_listings add column if not exists is_verified boolean not null default false;
alter table public.sitting_listings add column if not exists admin_note text;

alter table public.reports add column if not exists reporter_id uuid references auth.users(id) on delete set null default auth.uid();
alter table public.reports add column if not exists status text not null default 'open'
  check (status in ('open','reviewing','resolved','dismissed'));
alter table public.reports add column if not exists resolved_at timestamptz;
alter table public.reports add column if not exists resolved_by uuid references auth.users(id) on delete set null;
alter table public.reports add column if not exists resolution_note text;

-- ── User moderation ───────────────────────────────────────────────────────
create table if not exists public.user_moderation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  warning_count integer not null default 0,
  last_warning text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.user_moderation enable row level security;
drop policy if exists "Admins manage user moderation" on public.user_moderation;
create policy "Admins manage user moderation" on public.user_moderation for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());

-- ── Audit log ─────────────────────────────────────────────────────────────
create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit_logs enable row level security;
drop policy if exists "Admins read audit logs" on public.admin_audit_logs;
create policy "Admins read audit logs" on public.admin_audit_logs for select to authenticated
  using (public.is_current_admin());
create index if not exists admin_audit_created_idx on public.admin_audit_logs(created_at desc);

create or replace function public.write_admin_audit(
  p_action text, p_target_type text, p_target_id text default null,
  p_reason text default null, p_metadata jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_current_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  insert into public.admin_audit_logs(admin_id, action, target_type, target_id, reason, metadata)
  values(auth.uid(), p_action, p_target_type, p_target_id, p_reason, coalesce(p_metadata,'{}'::jsonb));
end $$;
revoke all on function public.write_admin_audit(text,text,text,text,jsonb) from public;
grant execute on function public.write_admin_audit(text,text,text,text,jsonb) to authenticated;

-- ── Database-backed clinics ───────────────────────────────────────────────
create table if not exists public.vet_clinics (
  id text primary key,
  name text not null,
  district text not null,
  address text not null,
  phone text not null,
  hours text not null,
  note text,
  lat double precision not null,
  lng double precision not null,
  services text[] not null default '{}',
  is_verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vet_clinics enable row level security;
drop policy if exists "Public read active clinics" on public.vet_clinics;
create policy "Public read active clinics" on public.vet_clinics for select using (is_active or public.is_current_admin());
drop policy if exists "Admins manage clinics" on public.vet_clinics;
create policy "Admins manage clinics" on public.vet_clinics for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());

insert into public.vet_clinics(id,name,district,address,phone,hours,note,lat,lng,services,is_verified)
values
('1','Тусгал мал эмнэлэг','Баянзүрх','Баянзүрх дүүрэг, 26-р хороо, Гачуултын зам','99119066','Өдөр бүр 09:00–20:00','Яаралтай тусламж 24 цаг',47.9035,106.9660,array['Үзлэг','Вакцин','Мэс засал'],true),
('2','Амьтны эрүүл мэндийн төв','Сүхбаатар','Сүхбаатар дүүрэг, 1-р хороо, Барилгачдын гудамж','99113355','Даваа–Бямба 09:00–18:00',null,47.9145,106.9205,array['Үзлэг','Вакцин','Шүд арчилгаа'],true),
('3','ПетВет эмнэлэг','Хан-Уул','Хан-Уул дүүрэг, 14-р хороо, Зайсангийн ам','99001122','Өдөр бүр 08:30–19:00','Нүдний мэс ажилбар',47.8846,106.9160,array['Үзлэг','Вакцин','Мэс засал','Шүд арчилгаа'],true),
('4','Баянгол мал эмнэлэг','Баянгол','Баянгол дүүрэг, 16-р хороо, 3-р гудамж','77112233','Даваа–Бямба 09:00–17:00',null,47.9050,106.8580,array['Үзлэг','Вакцин'],false),
('5','Нохой, муурны эмнэлэг','Чингэлтэй','Чингэлтэй дүүрэг, 5-р хороо, Чингисийн өргөн чөлөө','99554433','Өдөр бүр 10:00–20:00',null,47.9220,106.9050,array['Үзлэг','Вакцин','Шүд арчилгаа'],false),
('6','Сонгинохайрхан мал эмнэлэг','Сонгинохайрхан','Сонгинохайрхан дүүрэг, 32-р хороо, 3-р хороолол','88001122','Даваа–Бямба 09:00–18:00',null,47.9300,106.7820,array['Үзлэг','Вакцин'],false),
('7','Налайх мал эмнэлэг','Налайх','Налайх дүүрэг, 1-р хороо, Төв зам','77001122','Даваа–Бямба 09:00–17:00',null,47.7700,107.2500,array['Үзлэг','Вакцин'],false),
('8','Багануур мал эмнэлэг','Багануур','Багануур дүүрэг, 1-р хороо, Замын-Үүд','77002233','Даваа–Бямба 09:00–17:00',null,47.8200,108.3000,array['Үзлэг','Вакцин'],false),
('9','Мөр мал эмнэлэг','Баянзүрх','Баянзүрх дүүрэг, 15-р хороо, Модны хоолой','99223344','Өдөр бүр 09:00–21:00','Шөнийн эргэлттэй',47.9100,106.9550,array['Үзлэг','Вакцин','Мэс засал','Шүд арчилгаа'],true),
('10','Багахангай мал эмнэлэг','Багахангай','Багахангай дүүрэг, 1-р хороо','77003344','Даваа–Бямба 09:00–17:00',null,47.5500,106.9000,array['Үзлэг','Вакцин'],false)
on conflict(id) do nothing;

-- ── Admin access policies ─────────────────────────────────────────────────
drop policy if exists "Admins read donations" on public.donations;
create policy "Admins read donations" on public.donations for select to authenticated using (public.is_current_admin());
drop policy if exists "Admins update donations" on public.donations;
create policy "Admins update donations" on public.donations for update to authenticated using (public.is_current_admin());
drop policy if exists "Admins manage appointments" on public.appointments;
create policy "Admins manage appointments" on public.appointments for all to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());
drop policy if exists "Admins update adoptions" on public.adoptions;
create policy "Admins update adoptions" on public.adoptions for update to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());
drop policy if exists "Admins update sitting" on public.sitting_listings;
create policy "Admins update sitting" on public.sitting_listings for update to authenticated
  using (public.is_current_admin()) with check (public.is_current_admin());
drop policy if exists "Admins delete sitting" on public.sitting_listings;
create policy "Admins delete sitting" on public.sitting_listings for delete to authenticated using (public.is_current_admin());

-- Public listings must respect moderation.
drop policy if exists "Public read access" on public.pets;
create policy "Public read access" on public.pets for select using (not is_hidden or public.is_current_admin());
drop policy if exists "Public read adoptions" on public.adoptions;
create policy "Public read adoptions" on public.adoptions for select
  using (moderation_status in ('approved','adopted') or public.is_current_admin());
drop policy if exists "Public read sitting_listings" on public.sitting_listings;
create policy "Public read sitting_listings" on public.sitting_listings for select
  using (moderation_status = 'approved' or public.is_current_admin());

-- ── Secure admin RPCs ─────────────────────────────────────────────────────
create or replace function public.admin_dashboard_stats()
returns jsonb language plpgsql security definer set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_current_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  select jsonb_build_object(
    'users', (select count(*) from auth.users),
    'pets', (select count(*) from pets),
    'activePets', (select count(*) from pets where not resolved and not is_hidden),
    'resolvedPets', (select count(*) from pets where resolved),
    'adoptions', (select count(*) from adoptions),
    'sitting', (select count(*) from sitting_listings),
    'openReports', (select count(*) from reports where status in ('open','reviewing')),
    'appointments', (select count(*) from appointments),
    'pendingAppointments', (select count(*) from appointments where status='pending'),
    'paidDonations', (select coalesce(sum(amount),0) from donations where status='paid'),
    'todayListings', (select count(*) from pets where created_at >= current_date),
    'pushSubscriptions', (select count(*) from push_subscriptions)
  ) into result;
  return result;
end $$;
revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;

create or replace function public.admin_list_users(p_search text default '', p_limit int default 100)
returns table(user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz,
  banned_until timestamptz, warning_count int, pet_count bigint, adoption_count bigint)
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not public.is_current_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  return query
  select u.id, u.email::text, u.created_at, u.last_sign_in_at, u.banned_until,
    coalesce(m.warning_count,0),
    (select count(*) from public.pets p where p.created_by=u.id),
    (select count(*) from public.adoptions a where a.created_by=u.id)
  from auth.users u left join public.user_moderation m on m.user_id=u.id
  where p_search='' or u.email ilike '%'||p_search||'%'
  order by u.created_at desc limit least(greatest(p_limit,1),200);
end $$;
revoke all on function public.admin_list_users(text,int) from public;
grant execute on function public.admin_list_users(text,int) to authenticated;

create or replace function public.admin_moderate_user(
  p_user_id uuid, p_action text, p_reason text default null, p_ban_days int default 7
) returns void language plpgsql security definer set search_path = public, auth
as $$
begin
  if not public.is_current_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if p_user_id = auth.uid() and p_action in ('ban','delete') then raise exception 'CANNOT_MODERATE_SELF'; end if;
  if p_action='warn' then
    insert into public.user_moderation(user_id,warning_count,last_warning,updated_by)
    values(p_user_id,1,p_reason,auth.uid()) on conflict(user_id) do update
      set warning_count=user_moderation.warning_count+1,last_warning=excluded.last_warning,
          updated_at=now(),updated_by=auth.uid();
  elsif p_action='ban' then
    update auth.users set banned_until=now()+(least(greatest(p_ban_days,1),365)||' days')::interval where id=p_user_id;
  elsif p_action='unban' then
    update auth.users set banned_until=null where id=p_user_id;
  else raise exception 'INVALID_ACTION'; end if;
  perform public.write_admin_audit('user_'||p_action,'user',p_user_id::text,p_reason,jsonb_build_object('days',p_ban_days));
end $$;
revoke all on function public.admin_moderate_user(uuid,text,text,int) from public;
grant execute on function public.admin_moderate_user(uuid,text,text,int) to authenticated;

create or replace function public.admin_system_health()
returns jsonb language plpgsql security definer set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_current_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  select jsonb_build_object(
    'databaseSize', pg_database_size(current_database()),
    'petPhotos', (select count(*) from storage.objects where bucket_id='pet-photos'),
    'failedDonations', (select count(*) from donations where status='failed'),
    'stalePendingDonations', (select count(*) from donations where status='pending' and created_at < now()-interval '1 day'),
    'overdueAppointments', (select count(*) from appointments where status='pending' and date < current_date),
    'lastAuditAt', (select max(created_at) from admin_audit_logs)
  ) into result;
  return result;
end $$;
revoke all on function public.admin_system_health() from public;
grant execute on function public.admin_system_health() to authenticated;

-- Ensure authenticated role can call CRUD policies.
grant select, insert, update, delete on public.vet_clinics to authenticated;
grant select on public.admin_audit_logs to authenticated;
