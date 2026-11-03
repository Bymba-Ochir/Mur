-- МӨР production hardening migration
-- Supabase SQL Editor-т supabase-setup.sql, supabase-admin.sql-ийн дараа ажиллуулна.

-- 1. Storage: хэрэглэгч зөвхөн өөрийн хавтас руу бичиж/устгана.
drop policy if exists "Authenticated photo upload" on storage.objects;
create policy "Users upload own photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp')
  );
drop policy if exists "Users update own photos" on storage.objects;
create policy "Users update own photos" on storage.objects for update to authenticated
  using (bucket_id='pet-photos' and owner_id=auth.uid()::text)
  with check (bucket_id='pet-photos' and owner_id=auth.uid()::text);
drop policy if exists "Users delete own photos" on storage.objects;
create policy "Users delete own photos" on storage.objects for delete to authenticated
  using (bucket_id='pet-photos' and owner_id=auth.uid()::text);

-- 2. Чат block/report.
create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id),
  check(blocker_id<>blocked_id)
);
alter table public.user_blocks enable row level security;
drop policy if exists "Users manage own blocks" on public.user_blocks;
create policy "Users manage own blocks" on public.user_blocks for all to authenticated
  using(blocker_id=auth.uid()) with check(blocker_id=auth.uid());

create table if not exists public.chat_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check(char_length(reason) between 3 and 500),
  status text not null default 'open' check(status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  unique(reporter_id,conversation_id)
);
alter table public.chat_reports enable row level security;
drop policy if exists "Participants create chat reports" on public.chat_reports;
create policy "Participants create chat reports" on public.chat_reports for insert to authenticated
  with check(reporter_id=auth.uid() and exists(
    select 1 from public.conversations c where c.id=conversation_id
      and auth.uid() in(c.initiator_id,c.owner_id)
      and reported_user_id in(c.initiator_id,c.owner_id)
      and reported_user_id<>auth.uid()
  ));
drop policy if exists "Users read own chat reports" on public.chat_reports;
create policy "Users read own chat reports" on public.chat_reports for select to authenticated
  using(reporter_id=auth.uid() or public.is_current_admin());
drop policy if exists "Admins update chat reports" on public.chat_reports;
create policy "Admins update chat reports" on public.chat_reports for update to authenticated
  using(public.is_current_admin()) with check(public.is_current_admin());

-- Block хийсэн аль ч тал шинэ message илгээхгүй.
drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages" on public.messages for insert to authenticated
  with check(sender_id=auth.uid() and exists(
    select 1 from public.conversations c where c.id=conversation_id
      and auth.uid() in(c.initiator_id,c.owner_id)
      and not exists(
        select 1 from public.user_blocks b
        where (b.blocker_id=c.initiator_id and b.blocked_id=c.owner_id)
           or (b.blocker_id=c.owner_id and b.blocked_id=c.initiator_id)
      )
  ));

-- Нэг хэрэглэгч 1 минутад 20-оос олон message илгээхгүй.
create or replace function public.check_message_rate_limit() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if (select count(*) from public.messages
      where sender_id=new.sender_id and created_at>now()-interval '1 minute') >= 20 then
    raise exception 'MESSAGE_RATE_LIMIT';
  end if;
  return new;
end; $$;
drop trigger if exists trg_message_rate_limit on public.messages;
create trigger trg_message_rate_limit before insert on public.messages
for each row execute function public.check_message_rate_limit();

-- 3. Нэг эмнэлгийн нэг цагт зөвхөн нэг идэвхтэй захиалга.
create unique index if not exists appointments_unique_active_slot
  on public.appointments(clinic_id,date,time_slot)
  where status in ('pending','confirmed');

-- 4. Зар архивлах боломж.
alter table public.pets add column if not exists archived_at timestamptz;
alter table public.adoptions add column if not exists archived_at timestamptz;
alter table public.sitting_listings add column if not exists archived_at timestamptz;

-- Public жагсаалтад архивлагдсан мэдээлэл гарахгүй (admin харж болно).
drop policy if exists "Public read access" on public.pets;
create policy "Public read access" on public.pets for select
  using((archived_at is null and not coalesce(is_hidden,false)) or public.is_current_admin());
drop policy if exists "Public read adoptions" on public.adoptions;
create policy "Public read adoptions" on public.adoptions for select
  using((archived_at is null and moderation_status='approved') or created_by=auth.uid() or public.is_current_admin());
drop policy if exists "Public read sitting_listings" on public.sitting_listings;
create policy "Public read sitting_listings" on public.sitting_listings for select
  using((archived_at is null and moderation_status='approved') or user_id=auth.uid() or public.is_current_admin());

create index if not exists messages_sender_created_idx on public.messages(sender_id,created_at desc);
create index if not exists chat_reports_status_created_idx on public.chat_reports(status,created_at desc);
