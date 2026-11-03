-- МӨР listing UX upgrade — Supabase SQL Editor дээр нэг удаа ажиллуулна.
alter table public.pets add column if not exists expires_at timestamptz default (now() + interval '30 days');
alter table public.pets add column if not exists updated_at timestamptz default now();
alter table public.pets add column if not exists urgent boolean not null default false;
alter table public.pets add column if not exists view_count integer not null default 0;
alter table public.pets add column if not exists favorite_count integer not null default 0;

create table if not exists public.pet_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pet_id)
);
alter table public.pet_favorites enable row level security;
drop policy if exists "Users manage own pet favorites" on public.pet_favorites;
create policy "Users manage own pet favorites" on public.pet_favorites for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Хадгалсан хайлт',
  status text,
  pet_type text,
  district text,
  search_text text,
  notify boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.saved_searches enable row level security;
drop policy if exists "Users manage own saved searches" on public.saved_searches;
create policy "Users manage own saved searches" on public.saved_searches for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.user_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  volunteer_verified boolean not null default false,
  clinic_verified boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.user_verifications enable row level security;
drop policy if exists "Public read verification badges" on public.user_verifications;
create policy "Public read verification badges" on public.user_verifications for select using (true);

create table if not exists public.listing_notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade, title text not null,
  read boolean not null default false, created_at timestamptz not null default now(),
  unique(user_id, pet_id)
);
alter table public.listing_notifications enable row level security;
drop policy if exists "Users read own listing notifications" on public.listing_notifications;
create policy "Users read own listing notifications" on public.listing_notifications for all to authenticated
  using(auth.uid()=user_id) with check(auth.uid()=user_id);

create or replace function public.notify_saved_searches() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into listing_notifications(user_id,pet_id,title)
  select s.user_id,new.id,'Таны хадгалсан хайлтад тохирох шинэ зар нэмэгдлээ'
  from saved_searches s where s.notify=true
    and (s.status is null or new.status<>s.status)
    and (s.pet_type is null or new.type=s.pet_type)
    and (s.district is null or new.district=s.district)
    and (s.search_text is null or concat_ws(' ',new.name,new.breed,new.color,new.place) ilike '%'||s.search_text||'%')
  on conflict(user_id,pet_id) do nothing;
  return new;
end; $$;
drop trigger if exists pets_saved_search_notify on public.pets;
create trigger pets_saved_search_notify after insert on public.pets for each row execute function public.notify_saved_searches();

create or replace function public.increment_pet_view(target_pet uuid)
returns void language plpgsql security definer set search_path = public as $$
begin update pets set view_count = view_count + 1 where id = target_pet; end; $$;
grant execute on function public.increment_pet_view(uuid) to anon, authenticated;

create or replace function public.toggle_pet_favorite(target_pet uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare added boolean;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists(select 1 from pet_favorites where user_id=auth.uid() and pet_id=target_pet) then
    delete from pet_favorites where user_id=auth.uid() and pet_id=target_pet;
    update pets set favorite_count=greatest(0,favorite_count-1) where id=target_pet; added:=false;
  else
    insert into pet_favorites(user_id,pet_id) values(auth.uid(),target_pet);
    update pets set favorite_count=favorite_count+1 where id=target_pet; added:=true;
  end if;
  return added;
end; $$;
grant execute on function public.toggle_pet_favorite(uuid) to authenticated;

create or replace function public.renew_pet_listing(target_pet uuid)
returns void language plpgsql security invoker set search_path = public as $$
begin
  update pets set expires_at=now()+interval '30 days', updated_at=now()
  where id=target_pet and created_by=auth.uid();
end; $$;
grant execute on function public.renew_pet_listing(uuid) to authenticated;

create index if not exists pets_active_sort_idx on public.pets(resolved, expires_at, created_at desc);
create index if not exists pet_favorites_user_idx on public.pet_favorites(user_id, created_at desc);
