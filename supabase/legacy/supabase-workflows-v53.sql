-- МӨР v53: үрчлүүлэх хүсэлт, асрах захиалга, үнэлгээ, notification төв.
-- Эхлээд supabase-user-account-v52.sql ажилласан байх шаардлагатай.

alter table public.adoptions add column if not exists adopted boolean not null default false;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications" on public.notifications for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.adoption_applications (
  id uuid primary key default gen_random_uuid(),
  adoption_id uuid not null references public.adoptions(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint adoption_application_message_length check (char_length(message) between 10 and 1000),
  constraint adoption_application_not_self check (applicant_id <> owner_id)
);
create unique index if not exists adoption_application_active_unique on public.adoption_applications(adoption_id, applicant_id) where status = 'pending';
alter table public.adoption_applications enable row level security;
drop policy if exists "Application participants read" on public.adoption_applications;
create policy "Application participants read" on public.adoption_applications for select to authenticated using (auth.uid() in (applicant_id, owner_id));
drop policy if exists "Applicant creates application" on public.adoption_applications;
create policy "Applicant creates application" on public.adoption_applications for insert to authenticated with check (
  auth.uid() = applicant_id and owner_id = (select created_by from public.adoptions where id = adoption_id and adopted = false)
  and public.users_can_interact(applicant_id, owner_id)
);
drop policy if exists "Owner updates application" on public.adoption_applications;
create policy "Owner updates application" on public.adoption_applications for update to authenticated using (auth.uid() = owner_id or auth.uid() = applicant_id) with check (
  (auth.uid() = owner_id and status in ('accepted','rejected')) or (auth.uid() = applicant_id and status = 'cancelled')
);

create table if not exists public.sitting_bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.sitting_listings(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  sitter_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  note text,
  total_price integer,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sitting_booking_dates check (end_date >= start_date),
  constraint sitting_booking_not_self check (customer_id <> sitter_id),
  constraint sitting_booking_note_length check (note is null or char_length(note) <= 1000)
);
create unique index if not exists sitting_booking_active_unique on public.sitting_bookings(listing_id, customer_id, start_date, end_date) where status in ('pending','accepted');
alter table public.sitting_bookings enable row level security;
drop policy if exists "Booking participants read" on public.sitting_bookings;
create policy "Booking participants read" on public.sitting_bookings for select to authenticated using (auth.uid() in (customer_id, sitter_id));
drop policy if exists "Customer creates booking" on public.sitting_bookings;
create policy "Customer creates booking" on public.sitting_bookings for insert to authenticated with check (
  auth.uid() = customer_id and sitter_id = (select user_id from public.sitting_listings where id = listing_id)
  and public.users_can_interact(customer_id, sitter_id)
);
drop policy if exists "Booking participants update" on public.sitting_bookings;
create policy "Booking participants update" on public.sitting_bookings for update to authenticated using (auth.uid() in (customer_id, sitter_id)) with check (
  (auth.uid() = sitter_id and status in ('accepted','rejected','completed')) or (auth.uid() = customer_id and status = 'cancelled')
);

create table if not exists public.sitting_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.sitting_bookings(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  sitter_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  constraint sitting_review_comment_length check (comment is null or char_length(comment) <= 1000)
);
alter table public.sitting_reviews enable row level security;
drop policy if exists "Reviews public read" on public.sitting_reviews;
create policy "Reviews public read" on public.sitting_reviews for select using (true);
drop policy if exists "Customer creates review" on public.sitting_reviews;
create policy "Customer creates review" on public.sitting_reviews for insert to authenticated with check (
  auth.uid() = reviewer_id and exists (
    select 1 from public.sitting_bookings b where b.id = booking_id and b.customer_id = auth.uid() and b.sitter_id = sitting_reviews.sitter_id and b.status = 'completed'
  )
);

create or replace function public.prepare_adoption_application()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select created_by into new.owner_id from public.adoptions where id = new.adoption_id and adopted = false;
  if new.owner_id is null then raise exception 'ADOPTION_UNAVAILABLE'; end if;
  new.applicant_id := auth.uid();
  return new;
end; $$;
drop trigger if exists trg_prepare_adoption_application on public.adoption_applications;
create trigger trg_prepare_adoption_application before insert on public.adoption_applications for each row execute function public.prepare_adoption_application();

create or replace function public.prepare_sitting_booking()
returns trigger language plpgsql security definer set search_path = public as $$
declare daily_price integer;
begin
  select user_id, price into new.sitter_id, daily_price from public.sitting_listings where id = new.listing_id;
  if new.sitter_id is null then raise exception 'SITTING_UNAVAILABLE'; end if;
  new.customer_id := auth.uid();
  new.total_price := case when daily_price is null then null else daily_price * (new.end_date - new.start_date + 1) end;
  return new;
end; $$;
drop trigger if exists trg_prepare_sitting_booking on public.sitting_bookings;
create trigger trg_prepare_sitting_booking before insert on public.sitting_bookings for each row execute function public.prepare_sitting_booking();

create or replace function public.protect_workflow_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'adoption_applications' then
    new.adoption_id := old.adoption_id; new.applicant_id := old.applicant_id; new.owner_id := old.owner_id;
    new.message := old.message; new.created_at := old.created_at; new.updated_at := now();
    if old.status <> 'pending' or not ((auth.uid() = old.owner_id and new.status in ('accepted','rejected')) or (auth.uid() = old.applicant_id and new.status = 'cancelled')) then
      raise exception 'INVALID_APPLICATION_TRANSITION';
    end if;
  elsif tg_table_name = 'sitting_bookings' then
    new.listing_id := old.listing_id; new.customer_id := old.customer_id; new.sitter_id := old.sitter_id;
    new.start_date := old.start_date; new.end_date := old.end_date; new.note := old.note;
    new.total_price := old.total_price; new.created_at := old.created_at; new.updated_at := now();
    if not ((auth.uid() = old.sitter_id and ((old.status = 'pending' and new.status in ('accepted','rejected')) or (old.status = 'accepted' and new.status = 'completed'))) or (auth.uid() = old.customer_id and old.status in ('pending','accepted') and new.status = 'cancelled')) then
      raise exception 'INVALID_BOOKING_TRANSITION';
    end if;
    if new.status = 'accepted' and exists (
      select 1 from public.sitting_bookings b
      where b.id <> old.id and b.sitter_id = old.sitter_id and b.status = 'accepted'
        and b.start_date <= old.end_date and b.end_date >= old.start_date
    ) then raise exception 'BOOKING_DATES_UNAVAILABLE'; end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_protect_adoption_application on public.adoption_applications;
create trigger trg_protect_adoption_application before update on public.adoption_applications for each row execute function public.protect_workflow_update();
drop trigger if exists trg_protect_sitting_booking on public.sitting_bookings;
create trigger trg_protect_sitting_booking before update on public.sitting_bookings for each row execute function public.protect_workflow_update();

create or replace function public.notify_workflow_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'adoption_applications' then
    if tg_op = 'INSERT' then
      insert into public.notifications(user_id,type,title,body,href) values(new.owner_id,'adoption_application','Шинэ үрчлүүлэх хүсэлт','Таны зар дээр шинэ хүсэлт ирлээ.','/adoptions/'||new.adoption_id);
    elsif new.status is distinct from old.status then
      insert into public.notifications(user_id,type,title,body,href) values(new.applicant_id,'adoption_status','Үрчлүүлэх хүсэлт шинэчлэгдлээ','Таны хүсэлт: '||new.status,'/adoptions/'||new.adoption_id);
      if new.status = 'accepted' then
        update public.adoptions set adopted = true where id = new.adoption_id;
        update public.adoption_applications set status = 'rejected' where adoption_id = new.adoption_id and id <> new.id and status = 'pending';
      end if;
    end if;
  elsif tg_table_name = 'sitting_bookings' then
    if tg_op = 'INSERT' then
      insert into public.notifications(user_id,type,title,body,href) values(new.sitter_id,'sitting_booking','Шинэ асрах захиалга','Таны үйлчилгээнд шинэ хүсэлт ирлээ.','/sitting/'||new.listing_id);
    elsif new.status is distinct from old.status then
      insert into public.notifications(user_id,type,title,body,href) values(case when auth.uid() = new.sitter_id then new.customer_id else new.sitter_id end,'sitting_status','Асрах захиалга шинэчлэгдлээ','Захиалгын төлөв: '||new.status,'/sitting/'||new.listing_id);
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_notify_adoption_application on public.adoption_applications;
create trigger trg_notify_adoption_application after insert or update on public.adoption_applications for each row execute function public.notify_workflow_change();
drop trigger if exists trg_notify_sitting_booking on public.sitting_bookings;
create trigger trg_notify_sitting_booking after insert or update on public.sitting_bookings for each row execute function public.notify_workflow_change();

create index if not exists notifications_user_unread_idx on public.notifications(user_id, read_at, created_at desc);
create index if not exists adoption_applications_owner_idx on public.adoption_applications(owner_id, status, created_at desc);
create index if not exists sitting_bookings_sitter_idx on public.sitting_bookings(sitter_id, status, start_date);
create index if not exists sitting_reviews_sitter_idx on public.sitting_reviews(sitter_id, created_at desc);

do $$ begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime') and not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
