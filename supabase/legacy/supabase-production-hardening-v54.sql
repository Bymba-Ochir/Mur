-- МӨР v54: message unread/notification, server-only public writes, owned Storage paths.
-- supabase-workflows-v53.sql ажилласны дараа ажиллуулна.

-- 1. Sightings: зөвхөн authenticated server API бичнэ; reporter ID public query-д харагдахгүй.
alter table public.sightings add column if not exists reporter_id uuid references auth.users(id) on delete set null;
drop policy if exists "Anyone can add sighting" on public.sightings;
drop policy if exists "Authenticated add sighting" on public.sightings;
revoke insert on public.sightings from anon, authenticated;
revoke select on public.sightings from anon, authenticated;
grant select (id, pet_id, message, place, created_at) on public.sightings to anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'sightings_message_length') then
    alter table public.sightings add constraint sightings_message_length check (char_length(message) between 1 and 1000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sightings_place_length') then
    alter table public.sightings add constraint sightings_place_length check (place is null or char_length(place) <= 300) not valid;
  end if;
end $$;

create or replace function public.enforce_sighting_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.reporter_id is null then raise exception 'REPORTER_REQUIRED'; end if;
  if (select count(*) from public.sightings where reporter_id = new.reporter_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'SIGHTING_RATE_LIMIT';
  end if;
  return new;
end; $$;
drop trigger if exists trg_sighting_rate_limit on public.sightings;
create trigger trg_sighting_rate_limit before insert on public.sightings for each row execute function public.enforce_sighting_rate_limit();

-- 2. Pet reports: давхар report-оос хамгаалж, client direct insert-ийг хаана.
alter table public.reports add column if not exists reporter_id uuid references auth.users(id) on delete set null;
alter table public.reports add column if not exists status text not null default 'pending';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'reports_status_check') then
    alter table public.reports add constraint reports_status_check check (status in ('pending','reviewed','dismissed')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reports_reason_length') then
    alter table public.reports add constraint reports_reason_length check (char_length(reason) between 1 and 100) not valid;
  end if;
end $$;
create unique index if not exists reports_pending_user_unique on public.reports(pet_id, reporter_id) where status = 'pending' and reporter_id is not null;
drop policy if exists "Anyone can report" on public.reports;
drop policy if exists "Authenticated users can report" on public.reports;
revoke insert on public.reports from anon, authenticated;

-- 3. Push болон donation нь service-role API-аар л бичигдэнэ.
drop policy if exists "Anyone can subscribe" on public.push_subscriptions;
drop policy if exists "Users insert push subscriptions" on public.push_subscriptions;
drop policy if exists "Users update push subscriptions" on public.push_subscriptions;
revoke insert, update on public.push_subscriptions from anon, authenticated;
drop policy if exists "Anyone can create donation" on public.donations;
revoke insert on public.donations from anon, authenticated;

-- 4. Message recipient л read_at-г нэг удаа шинэчилнэ; бусад багана өөрчлөгдөхгүй.
drop policy if exists "Recipients mark messages read" on public.messages;
create policy "Recipients mark messages read" on public.messages for update to authenticated
using (
  sender_id <> auth.uid() and exists (
    select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.initiator_id, c.owner_id)
  )
)
with check (
  sender_id <> auth.uid() and read_at is not null and exists (
    select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.initiator_id, c.owner_id)
  )
);

create or replace function public.protect_message_read_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.sender_id then raise exception 'SENDER_CANNOT_MARK_READ'; end if;
  new.id := old.id; new.conversation_id := old.conversation_id; new.sender_id := old.sender_id;
  new.content := old.content; new.created_at := old.created_at;
  if old.read_at is not null then new.read_at := old.read_at; end if;
  if new.read_at is null then raise exception 'READ_AT_REQUIRED'; end if;
  return new;
end; $$;
drop trigger if exists trg_protect_message_read_update on public.messages;
create trigger trg_protect_message_read_update before update on public.messages for each row execute function public.protect_message_read_update();

-- 5. Шинэ мессежид in-app notification үүсгэнэ (хэрэглэгчийн preference-г хүндэтгэнэ).
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare recipient uuid; enabled boolean := true;
begin
  select case when new.sender_id = c.initiator_id then c.owner_id else c.initiator_id end
    into recipient from public.conversations c where c.id = new.conversation_id;
  if recipient is null or recipient = new.sender_id then return new; end if;
  select coalesce((p.notification_preferences->>'messages')::boolean, true) into enabled from public.profiles p where p.id = recipient;
  if coalesce(enabled, true) then
    insert into public.notifications(user_id,type,title,body,href)
    values(recipient,'message','Шинэ мессеж ирлээ','Танд шинэ мессеж ирсэн байна.','/messages/'||new.conversation_id);
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message after insert on public.messages for each row execute function public.notify_new_message();
create index if not exists messages_recipient_unread_idx on public.messages(conversation_id, read_at, created_at desc);

-- 6. Шинэ зураг зөвхөн тухайн хэрэглэгчийн UUID folder дотор upload хийнэ.
drop policy if exists "Authenticated photo upload" on storage.objects;
drop policy if exists "Users upload own pet photos" on storage.objects;
create policy "Users upload own pet photos" on storage.objects for insert to authenticated with check (
  bucket_id = 'pet-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('jpg','jpeg','png','webp')
);

create index if not exists sightings_reporter_idx on public.sightings(reporter_id, created_at desc);
create index if not exists reports_reporter_idx on public.reports(reporter_id, created_at desc);
