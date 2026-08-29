-- МӨР v55: хадгалсан зар, хадгалсан хайлт, тохирох шинэ зарын мэдэгдэл.
-- Эхлээд supabase-workflows-v53.sql болон supabase-production-hardening-v54.sql ажилласан байна.

alter table public.pets add column if not exists favorite_count integer not null default 0 check (favorite_count >= 0);

create table if not exists public.pet_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pet_id)
);
alter table public.pet_favorites enable row level security;
drop policy if exists "Users manage own pet favorites" on public.pet_favorites;
drop policy if exists "Users read own pet favorites" on public.pet_favorites;
create policy "Users read own pet favorites" on public.pet_favorites
  for select to authenticated using (auth.uid() = user_id);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 180),
  status text check (status is null or status in ('lost', 'found')),
  pet_type text check (pet_type is null or pet_type in ('Нохой', 'Муур', 'Бусад')),
  district text,
  search_text text check (search_text is null or char_length(search_text) <= 100),
  notify boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.saved_searches enable row level security;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'saved_search_name_length') then
    alter table public.saved_searches add constraint saved_search_name_length check (char_length(name) between 1 and 180);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saved_search_status_valid') then
    alter table public.saved_searches add constraint saved_search_status_valid check (status is null or status in ('lost', 'found'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saved_search_pet_type_valid') then
    alter table public.saved_searches add constraint saved_search_pet_type_valid check (pet_type is null or pet_type in ('Нохой', 'Муур', 'Бусад'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saved_search_text_length') then
    alter table public.saved_searches add constraint saved_search_text_length check (search_text is null or char_length(search_text) <= 100);
  end if;
end $$;
drop policy if exists "Users manage own saved searches" on public.saved_searches;
create policy "Users manage own saved searches" on public.saved_searches
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create unique index if not exists saved_searches_filter_unique
  on public.saved_searches (
    user_id,
    coalesce(status, ''),
    coalesce(pet_type, ''),
    coalesce(district, ''),
    coalesce(lower(search_text), '')
  );
create index if not exists saved_searches_notify_idx on public.saved_searches(notify) where notify = true;

create or replace function public.prepare_saved_search()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  new.user_id := auth.uid();
  new.name := trim(new.name);
  new.search_text := nullif(trim(new.search_text), '');
  return new;
end; $$;
drop trigger if exists trg_prepare_saved_search on public.saved_searches;
create trigger trg_prepare_saved_search before insert on public.saved_searches
  for each row execute function public.prepare_saved_search();

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
  update public.pets p set favorite_count = (select count(*)::integer from public.pet_favorites f where f.pet_id = target_pet)
    where p.id = target_pet;
  return added;
end; $$;
revoke all on function public.toggle_pet_favorite(uuid) from public;
grant execute on function public.toggle_pet_favorite(uuid) to authenticated;

create or replace function public.notify_saved_searches()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications(user_id, type, title, body, href)
  select s.user_id,
         'saved_search',
         'Таны хайлттай тохирох шинэ зар',
         concat(case when new.status = 'lost' then 'Алдсан' else 'Олдсон' end, ' ', new.type, ' — ', coalesce(new.district, 'байршилгүй')),
         '/pets/' || new.id
    from public.saved_searches s
    left join public.profiles p on p.id = s.user_id
   where s.notify = true
     and s.user_id is distinct from new.created_by
     and (s.status is null or s.status = new.status)
     and (s.pet_type is null or s.pet_type = new.type)
     and (s.district is null or s.district = new.district)
     and (s.search_text is null or position(lower(s.search_text) in lower(concat_ws(' ', new.name, new.type, new.breed, new.color, new.place, new.district))) > 0)
     and coalesce((p.notification_preferences->>'matches')::boolean, true);
  return new;
end; $$;
drop trigger if exists trg_notify_saved_searches on public.pets;
drop trigger if exists pets_saved_search_notify on public.pets;
create trigger trg_notify_saved_searches after insert on public.pets
  for each row execute function public.notify_saved_searches();

create index if not exists pet_favorites_pet_idx on public.pet_favorites(pet_id);
