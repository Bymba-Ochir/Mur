-- PRE-DEPLOY: apply manually before deploying phone privacy / listing chat.
begin;

alter table public.pets add column phone_hidden boolean not null default false;
alter table public.adoptions add column phone_hidden boolean not null default false;
alter table public.sitting_listings add column phone_hidden boolean not null default false;
alter table public.pets add constraint pets_hidden_phone_redacted check (not phone_hidden or phone = '');
alter table public.adoptions add constraint adoptions_hidden_phone_redacted check (not phone_hidden or phone = '');
alter table public.sitting_listings add constraint sitting_hidden_phone_redacted check (not phone_hidden or phone = '');

-- A phone has one storage location: public when shared, private when hidden.
-- The private schema is not exposed by PostgREST or Realtime. FKs retain ownership
-- through the parent and remove private contacts when the listing is deleted.
create schema if not exists mur_private;
revoke all on schema mur_private from public, anon, authenticated, service_role;
create table mur_private.hidden_listing_phones (
  pet_id uuid unique references public.pets(id) on delete cascade deferrable initially deferred,
  adoption_id uuid unique references public.adoptions(id) on delete cascade deferrable initially deferred,
  sitting_id uuid unique references public.sitting_listings(id) on delete cascade deferrable initially deferred,
  phone text not null check (phone ~ '^[0-9]{8}$'),
  constraint hidden_phone_one_listing check (num_nonnulls(pet_id, adoption_id, sitting_id) = 1)
);
alter table mur_private.hidden_listing_phones enable row level security;
revoke all on mur_private.hidden_listing_phones from public, anon, authenticated, service_role;

create function public.protect_listing_phone()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare fk text; saved_phone text;
begin
  fk := case tg_table_name when 'pets' then 'pet_id' when 'adoptions' then 'adoption_id'
    when 'sitting_listings' then 'sitting_id' end;
  if fk is null then raise exception 'INVALID_LISTING_KIND'; end if;
  if tg_op = 'UPDATE' and new.id is distinct from old.id then raise exception 'LISTING_ID_IMMUTABLE'; end if;
  if new.phone_hidden then
    if coalesce(new.phone,'') <> '' then
      saved_phone := regexp_replace(new.phone,'\D','','g');
      if saved_phone ~ '^976[0-9]{8}$' then saved_phone := substr(saved_phone,4); end if;
      if saved_phone !~ '^[0-9]{8}$' then raise exception 'INVALID_PHONE'; end if;
      execute format('insert into mur_private.hidden_listing_phones(%I,phone) values ($1,$2)
        on conflict (%I) do update set phone=excluded.phone',fk,fk) using new.id,saved_phone;
    end if;
    new.phone := '';
  else
    if tg_op = 'UPDATE' and old.phone_hidden and coalesce(new.phone,'') = '' then
      execute format('select phone from mur_private.hidden_listing_phones where %I=$1',fk) into saved_phone using new.id;
      if saved_phone is null then raise exception 'PHONE_REQUIRED'; end if;
      new.phone := saved_phone;
    end if;
    execute format('delete from mur_private.hidden_listing_phones where %I=$1',fk) using new.id;
  end if;
  return new;
end;
$$;
-- Must run before the existing validators and before any AFTER outbox trigger.
create trigger protect_listing_phone before insert or update on public.pets for each row execute function public.protect_listing_phone();
create trigger protect_listing_phone before insert or update on public.adoptions for each row execute function public.protect_listing_phone();
create trigger protect_listing_phone before insert or update on public.sitting_listings for each row execute function public.protect_listing_phone();
revoke all on function public.protect_listing_phone() from public, anon, authenticated, service_role;

create function public.get_own_listing_phone(target_kind text, target_id uuid)
returns text language plpgsql security definer set search_path = pg_catalog, public as $$
declare viewer uuid := auth.uid(); owner_id uuid; result text;
begin
  if viewer is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  case target_kind
    when 'pet' then
      select created_by into owner_id from public.pets where id=target_id;
      if owner_id=viewer then select phone into result from mur_private.hidden_listing_phones where pet_id=target_id; end if;
    when 'adoption' then
      select created_by into owner_id from public.adoptions where id=target_id;
      if owner_id=viewer then select phone into result from mur_private.hidden_listing_phones where adoption_id=target_id; end if;
    when 'sitting' then
      select user_id into owner_id from public.sitting_listings where id=target_id;
      if owner_id=viewer then select phone into result from mur_private.hidden_listing_phones where sitting_id=target_id; end if;
    else raise exception 'INVALID_LISTING_KIND';
  end case;
  if owner_id is distinct from viewer then raise exception 'OWNER_REQUIRED' using errcode='42501'; end if;
  return coalesce(result,'');
end;
$$;
revoke all on function public.get_own_listing_phone(text,uuid) from public,anon,service_role;
grant execute on function public.get_own_listing_phone(text,uuid) to authenticated;

-- Private phones must not collapse different users into one phone='' rate bucket.
-- Keep the existing five/hour limit and serialize same-owner inserts.
create or replace function public.check_pet_rate_limit()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('pet-post:' || new.created_by::text,0));
  if new.phone <> '' then perform pg_advisory_xact_lock(hashtextextended('pet-phone:' || new.phone,0)); end if;
  if (select count(*) from (select 1 from public.pets where (created_by=new.created_by or (new.phone<>'' and phone=new.phone))
    and created_at > now()-interval '1 hour' limit 5) p) >= 5 then raise exception 'RATE_LIMIT: Хэт олон удаа мэдээлэл илгээлээ.'; end if;
  return new;
end;
$$;
create or replace function public.check_adoption_rate_limit()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('adoption-post:' || new.created_by::text,0));
  if new.phone <> '' then perform pg_advisory_xact_lock(hashtextextended('adoption-phone:' || new.phone,0)); end if;
  if (select count(*) from (select 1 from public.adoptions where (created_by=new.created_by or (new.phone<>'' and phone=new.phone))
    and created_at > now()-interval '1 hour' limit 5) a) >= 5 then raise exception 'RATE_LIMIT: Хэт олон удаа зар нийтлээ.'; end if;
  return new;
end;
$$;
create index if not exists pets_owner_recent_idx on public.pets(created_by,created_at desc);
create index if not exists adoptions_owner_recent_idx on public.adoptions(created_by,created_at desc);
create index if not exists adoptions_phone_recent_idx on public.adoptions(phone,created_at desc) where phone<>'';

-- Extend the existing participant-protected chat; each conversation has exactly
-- one real listing FK, and each initiator gets at most one chat per listing.
alter table public.conversations alter column pet_id drop not null;
alter table public.conversations add column adoption_id uuid references public.adoptions(id) on delete cascade;
alter table public.conversations add column sitting_id uuid references public.sitting_listings(id) on delete cascade;
alter table public.conversations add constraint conversation_one_listing check (num_nonnulls(pet_id,adoption_id,sitting_id)=1);
alter table public.conversations add constraint conversations_unique_adoption unique (adoption_id,initiator_id);
alter table public.conversations add constraint conversations_unique_sitting unique (sitting_id,initiator_id);

drop policy if exists "Initiator can create conversation" on public.conversations;
create policy "Initiator can create conversation" on public.conversations for insert to authenticated with check (
  initiator_id=auth.uid() and initiator_id<>owner_id and public.users_can_interact(initiator_id,owner_id)
  and (
    (pet_id is not null and owner_id=(select created_by from public.pets where id=pet_id)) or
    (adoption_id is not null and owner_id=(select created_by from public.adoptions where id=adoption_id)) or
    (sitting_id is not null and owner_id=(select user_id from public.sitting_listings where id=sitting_id))
  )
);

create function public.start_listing_conversation(target_kind text, target_id uuid)
returns uuid language plpgsql security invoker set search_path = pg_catalog, public as $$
declare viewer uuid := auth.uid(); listing_owner uuid; result uuid;
begin
  if viewer is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  -- Serializing this viewer also makes retries and the new-chat quota atomic.
  perform pg_advisory_xact_lock(hashtextextended('start-chat:' || viewer::text,0));
  case target_kind
    when 'pet' then select created_by into listing_owner from public.pets where id=target_id;
    when 'adoption' then select created_by into listing_owner from public.adoptions where id=target_id;
    when 'sitting' then select user_id into listing_owner from public.sitting_listings where id=target_id;
    else raise exception 'INVALID_LISTING_KIND';
  end case;
  if listing_owner is null then raise exception 'LISTING_NOT_FOUND'; end if;
  if listing_owner=viewer then raise exception 'SELF_CHAT'; end if;
  if not public.users_can_interact(viewer,listing_owner) then raise exception 'INTERACTION_DENIED' using errcode='42501'; end if;
  select id into result from public.conversations where initiator_id=viewer and
    case target_kind when 'pet' then pet_id=target_id when 'adoption' then adoption_id=target_id else sitting_id=target_id end;
  if result is not null then return result; end if;
  if (select count(*) from (select 1 from public.conversations where initiator_id=viewer
    and created_at>now()-interval '1 hour' limit 20) c) >= 20 then raise exception 'CHAT_RATE_LIMIT'; end if;
  insert into public.conversations(pet_id,adoption_id,sitting_id,initiator_id,owner_id) values (
    case when target_kind='pet' then target_id end,
    case when target_kind='adoption' then target_id end,
    case when target_kind='sitting' then target_id end,viewer,listing_owner
  ) on conflict do nothing returning id into result;
  if result is null then
    select id into result from public.conversations where initiator_id=viewer and
      case target_kind when 'pet' then pet_id=target_id when 'adoption' then adoption_id=target_id else sitting_id=target_id end;
  end if;
  return result;
end;
$$;
revoke all on function public.start_listing_conversation(text,uuid) from public,anon,service_role;
grant execute on function public.start_listing_conversation(text,uuid) to authenticated;
create function public.enforce_conversation_rate_limit()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('start-chat:' || new.initiator_id::text,0));
  if (select count(*) from (select 1 from public.conversations where initiator_id=new.initiator_id
    and created_at>now()-interval '1 hour' limit 20) c) >= 20 then raise exception 'CHAT_RATE_LIMIT'; end if;
  return new;
end;
$$;
revoke all on function public.enforce_conversation_rate_limit() from public,anon,authenticated,service_role;
create trigger enforce_conversation_rate_limit before insert on public.conversations
for each row execute function public.enforce_conversation_rate_limit();
create index if not exists conversations_initiator_recent_idx on public.conversations(initiator_id,created_at desc,id desc);
create index if not exists conversations_owner_recent_idx on public.conversations(owner_id,created_at desc,id desc);
create index if not exists messages_conversation_latest_idx on public.messages(conversation_id,created_at desc,id desc);
create index if not exists messages_conversation_unread_idx on public.messages(conversation_id,sender_id) where read_at is null;

-- Read only one inbox page, its latest messages and unread aggregates. Avoid
-- downloading all message histories just to build the conversation list.
create function public.list_conversation_page(before_created_at timestamptz default null, before_id uuid default null)
returns table(conversation jsonb, pet jsonb, last_message jsonb, unread_count bigint)
language sql stable security invoker set search_path = pg_catalog, public as $$
  with heads as (
    select c.* from public.conversations c where (initiator_id=auth.uid() or owner_id=auth.uid())
      and (before_created_at is null or (c.created_at,c.id)<(before_created_at,before_id))
    order by c.created_at desc,c.id desc limit 21
  )
  select to_jsonb(c),
    case when p.id is not null then jsonb_build_object('id',p.id,'name',p.name,'type',p.type,'status',p.status,'resolved',p.resolved) end,
    latest.body,
    (select count(*) from public.messages m where m.conversation_id=c.id and m.sender_id<>auth.uid() and m.read_at is null)
  from heads c left join public.pets p on p.id=c.pet_id
  left join lateral (
    select to_jsonb(m) body from public.messages m where m.conversation_id=c.id
    order by m.created_at desc,m.id desc limit 1
  ) latest on true
  order by c.created_at desc,c.id desc;
$$;
revoke all on function public.list_conversation_page(timestamptz,uuid) from public,anon,service_role;
grant execute on function public.list_conversation_page(timestamptz,uuid) to authenticated;

notify pgrst,'reload schema';
commit;
