begin;

create function public.publish_pet_report(target_id uuid, report jsonb, target_urls text[])
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  existing_owner uuid;
  details public.pets;
begin
  if viewer is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if target_id is null then raise exception 'REPORT_ID_REQUIRED' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended('publish_pet_report:' || target_id::text, 0));
  select created_by into existing_owner from public.pets where id = target_id;
  if found then
    if existing_owner is distinct from viewer then
      raise exception 'REPORT_ID_CONFLICT' using errcode = '23505';
    end if;
    -- A draft created before atomic publication can already have a parent row.
    if cardinality(target_urls) > 0 and not exists (
      select 1 from public.pet_photos where pet_id = target_id
    ) then
      perform public.replace_pet_photos(target_id, target_urls);
    end if;
    return target_id;
  end if;

  details := jsonb_populate_record(null::public.pets, report);
  if nullif(btrim(details.district), '') is null then
    raise exception 'DISTRICT_REQUIRED' using errcode = '22023';
  end if;

  insert into public.pets (
    id, created_by, status, name, type, breed, color, place, district,
    phone, phone_hidden, has_reward, reward, lat, lng
  ) values (
    target_id, viewer, details.status, details.name, details.type, details.breed, details.color,
    details.place, details.district, details.phone, details.phone_hidden, details.has_reward,
    details.reward, details.lat, details.lng
  );
  if cardinality(target_urls) > 0 then
    perform public.replace_pet_photos(target_id, target_urls);
  end if;
  return target_id;
end;
$$;

revoke all on function public.publish_pet_report(uuid, jsonb, text[]) from public, anon;
grant execute on function public.publish_pet_report(uuid, jsonb, text[]) to authenticated;

commit;
