-- МӨР v52: хэрэглэгчийн profile, тохиргоо, block/report, account privacy.
-- Supabase SQL Editor дээр нэг удаа ажиллуулна. Дахин ажиллуулахад аюулгүй.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  district text,
  bio text,
  is_volunteer boolean not null default false,
  email_verified boolean not null default false,
  notification_preferences jsonb not null default '{"messages":true,"matches":true,"vaccines":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_name_length check (char_length(display_name) <= 100),
  constraint profiles_bio_length check (char_length(bio) <= 500)
);

alter table public.profiles enable row level security;
drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable" on public.profiles for select using (true);
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- Хуучин хэрэглэгчдэд profile нөхөж үүсгэнэ.
insert into public.profiles (id, display_name, email_verified)
select id, split_part(coalesce(email, ''), '@', 1), email_confirmed_at is not null
from auth.users
on conflict (id) do nothing;

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint cannot_block_self check (blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
drop policy if exists "Users read own blocks" on public.user_blocks;
create policy "Users read own blocks" on public.user_blocks for select to authenticated using (auth.uid() = blocker_id);
drop policy if exists "Users create own blocks" on public.user_blocks;
create policy "Users create own blocks" on public.user_blocks for insert to authenticated with check (auth.uid() = blocker_id);
drop policy if exists "Users delete own blocks" on public.user_blocks;
create policy "Users delete own blocks" on public.user_blocks for delete to authenticated using (auth.uid() = blocker_id);

create or replace function public.users_can_interact(first_user uuid, second_user uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select not exists (
    select 1 from public.user_blocks b
    where (b.blocker_id = first_user and b.blocked_id = second_user)
       or (b.blocker_id = second_user and b.blocked_id = first_user)
  );
$$;

-- Хаасан хэрэглэгчийн зар өөрийн жагсаалтад харагдахгүй.
drop policy if exists "Public read access" on public.pets;
create policy "Public read access" on public.pets for select using (
  auth.uid() is null or created_by = auth.uid() or not exists (
    select 1 from public.user_blocks b where b.blocker_id = auth.uid() and b.blocked_id = pets.created_by
  )
);
drop policy if exists "Public read adoptions" on public.adoptions;
create policy "Public read adoptions" on public.adoptions for select using (
  auth.uid() is null or created_by = auth.uid() or not exists (
    select 1 from public.user_blocks b where b.blocker_id = auth.uid() and b.blocked_id = adoptions.created_by
  )
);
drop policy if exists "Public read sitting_listings" on public.sitting_listings;
create policy "Public read sitting_listings" on public.sitting_listings for select using (
  auth.uid() is null or user_id = auth.uid() or not exists (
    select 1 from public.user_blocks b where b.blocker_id = auth.uid() and b.blocked_id = sitting_listings.user_id
  )
);

-- Аль нэг тал нөгөөгөө хаасан үед шинэ чат, мессежийг DB түвшинд хориглоно.
drop policy if exists "Initiator can create conversation" on public.conversations;
create policy "Initiator can create conversation" on public.conversations for insert to authenticated with check (
  initiator_id = auth.uid()
  and owner_id = (select created_by from public.pets where id = pet_id)
  and initiator_id <> owner_id
  and public.users_can_interact(initiator_id, owner_id)
);
drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.initiator_id = auth.uid() or c.owner_id = auth.uid())
      and public.users_can_interact(c.initiator_id, c.owner_id)
  )
);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  constraint cannot_report_self check (reporter_id <> reported_id),
  constraint user_report_reason_length check (char_length(reason) between 3 and 500)
);
create unique index if not exists user_reports_pending_unique
  on public.user_reports (reporter_id, reported_id) where status = 'pending';
alter table public.user_reports enable row level security;
drop policy if exists "Users create reports" on public.user_reports;
create policy "Users create reports" on public.user_reports for insert to authenticated with check (auth.uid() = reporter_id);
drop policy if exists "Users read own reports" on public.user_reports;
create policy "Users read own reports" on public.user_reports for select to authenticated using (
  auth.uid() = reporter_id or auth.uid() in (select user_id from public.admins)
);
drop policy if exists "Admins update user reports" on public.user_reports;
create policy "Admins update user reports" on public.user_reports for update to authenticated using (
  auth.uid() in (select user_id from public.admins)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public avatar read" on storage.objects;
create policy "Public avatar read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar" on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar" on storage.objects for update to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar" on storage.objects for delete to authenticated using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create index if not exists profiles_created_at_idx on public.profiles(created_at desc);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);
create index if not exists user_reports_status_idx on public.user_reports(status, created_at desc);
