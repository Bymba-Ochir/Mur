-- Match only active public covers, including when an archived row still exists.
begin;

create or replace function public.match_pet_cover_ids(
  query_fingerprint text, query_status text, query_type text, query_district text, query_text text
)
returns table (id uuid) language sql stable security invoker set search_path = pg_catalog, public as $$
  with input as (
    select case when query_fingerprint ~ '^[01]{64}$' then query_fingerprint::bit(64) end as fingerprint,
      lower(left(btrim(coalesce(query_text, '')), 100)) as term
  )
  select p.id from public.pets p cross join input i
  where p.cover_fingerprint is not null and not p.resolved and not p.is_hidden and p.archived_at is null
    and (query_status is null or p.status = query_status)
    and (query_type is null or p.type = query_type)
    and (query_district is null or p.district = query_district)
    and (i.term = '' or exists (
      select 1 from unnest(array[p.name, p.breed, p.color, p.place, p.type]) as field(value)
      where strpos(lower(field.value), i.term) > 0
    ))
    and bit_count(p.cover_fingerprint # i.fingerprint) <= 10
  order by bit_count(p.cover_fingerprint # i.fingerprint), p.created_at desc, p.id
  limit 8;
$$;

create or replace function public.queue_missing_pet_cover_fingerprints()
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare candidate record; revision uuid;
begin
  for candidate in
    select p.id, p.embedding_revision, p.embedding_photo_url, cover.url
    from public.pets p
    cross join lateral (
      select pp.url from public.pet_photos pp where pp.pet_id = p.id order by pp.position limit 1
    ) cover
    where not p.resolved and not p.is_hidden and p.archived_at is null and p.cover_fingerprint is null
      and not exists (
        select 1 from public.background_jobs j
        where j.dedupe_key = 'pet-cover:' || p.embedding_revision::text
          or (j.dedupe_key = 'pet-image:' || p.embedding_revision::text and j.status in ('pending', 'running'))
      )
    order by p.created_at desc, p.id
    limit 3 for update of p skip locked
  loop
    revision := candidate.embedding_revision;
    if revision is null or candidate.embedding_photo_url is distinct from candidate.url then
      revision := gen_random_uuid();
      update public.pets set embedding_revision = revision, embedding_photo_url = candidate.url,
        dino_embedding = null, color_signature = null, embedding_version = null, image_hash = null
        where id = candidate.id;
    end if;
    perform public.enqueue_background_job('pet-image-embedding', 'pet-cover:' || revision::text,
      jsonb_build_object('petId', candidate.id, 'revision', revision, 'coverOnly', true));
  end loop;
end;
$$;

commit;
