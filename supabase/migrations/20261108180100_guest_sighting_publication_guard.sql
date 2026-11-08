-- Pre-deploy after 20261108180000. Preserve the signed-in reporter quota.
begin;

create or replace function public.enforce_sighting_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.guest_report then
    if not exists (
      select 1 from public.guest_sightings g
      where g.id = new.id and g.pet_id = new.pet_id
        and new.lat is not distinct from round(g.lat::numeric, 2)::double precision
        and new.lng is not distinct from round(g.lng::numeric, 2)::double precision
    ) then raise exception 'GUEST_SIGHTING_REQUIRED'; end if;
    return new;
  end if;

  if new.reporter_id is null then raise exception 'REPORTER_REQUIRED'; end if;
  if (select count(*) from public.sightings
      where reporter_id = new.reporter_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'SIGHTING_RATE_LIMIT';
  end if;
  return new;
end;
$$;

commit;
