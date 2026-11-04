-- Forward migration: browser-supplied dates must not bypass listing/chat quotas
-- or move existing records across keyset pagination cursors.
begin;
create function public.stamp_listing_created_at()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
  if current_user in ('anon','authenticated') then
    if tg_op='INSERT' then new.created_at:=clock_timestamp();
    else new.created_at:=old.created_at; end if;
  end if;
  return new;
end;
$$;
revoke all on function public.stamp_listing_created_at() from public,anon,authenticated,service_role;
create trigger stamp_listing_created_at before insert or update on public.pets for each row execute function public.stamp_listing_created_at();
create trigger stamp_listing_created_at before insert or update on public.adoptions for each row execute function public.stamp_listing_created_at();
create trigger stamp_listing_created_at before insert or update on public.sitting_listings for each row execute function public.stamp_listing_created_at();
create trigger stamp_listing_created_at before insert or update on public.conversations for each row execute function public.stamp_listing_created_at();
notify pgrst,'reload schema';
commit;
