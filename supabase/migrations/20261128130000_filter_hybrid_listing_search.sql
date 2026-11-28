begin;

-- Filter active listings before ranking and limiting image matches.
create function public.match_listing_pets_hybrid(
  query_embedding extensions.vector(384),
  query_text text,
  query_image_hash text default null,
  query_status text default null,
  query_type text default null,
  query_breed text default null,
  query_color text default null,
  query_district text default null,
  query_lat double precision default null,
  query_lng double precision default null,
  match_count integer default 20,
  min_image_similarity double precision default 0.15,
  filter_district boolean default true
)
returns table (
  pet jsonb,
  image_similarity double precision,
  hybrid_score double precision
)
language sql
stable
security invoker
set search_path = pg_catalog, public, extensions
as $$
  with input as (
    select lower(left(btrim(coalesce(query_text, '')), 100)) as term
  ), candidates as (
    select
      p,
      (query_image_hash is not null and p.image_hash = query_image_hash) as exact_match,
      case
        when query_image_hash is not null and p.image_hash = query_image_hash then 1::double precision
        else greatest(0::double precision, 1 - (p.dino_embedding <=> query_embedding))
      end as img_score,
      case when query_type is not null and p.type = query_type then 8 else 0 end as type_score,
      case when query_breed is not null and query_breed <> '' and lower(p.breed) = lower(query_breed) then 7 else 0 end as breed_score,
      case when query_color is not null and query_color <> '' and lower(p.color) like '%' || lower(query_color) || '%' then 5 else 0 end as color_score,
      case when query_district is not null and p.district = query_district then 3 else 0 end as district_score,
      case
        when query_lat is not null and query_lng is not null and p.lat is not null and p.lng is not null
             and abs(p.lat - query_lat) <= 0.08 and abs(p.lng - query_lng) <= 0.08 then 2
        else 0
      end as nearby_score,
      greatest(0::double precision, 5 - extract(epoch from (now() - p.created_at)) / 86400 / 30) as recency_score
    from public.pets p cross join input i
    where p.dino_embedding is not null
      and p.embedding_version = 'dinov2-small-q8-v1'
      and not p.resolved and not p.is_hidden and p.archived_at is null
      and (query_status is null or p.status <> query_status)
      and (query_type is null or p.type = query_type)
      and (not filter_district or query_district is null or p.district = query_district)
      and (i.term = '' or exists (
        select 1 from unnest(array[p.name, p.breed, p.color, p.place, p.type]) as field(value)
        where strpos(lower(field.value), i.term) > 0
      ))
  )
  select
    to_jsonb(c.p) - 'reward' - 'color_signature' - 'image_embedding' - 'dino_embedding' - 'image_hash' as pet,
    c.img_score as image_similarity,
    case
      when c.exact_match then 100::double precision
      else round((
        (c.img_score * 70 + c.type_score + c.breed_score + c.color_score + c.district_score + c.nearby_score + c.recency_score)
        / nullif(
          75
          + case when query_type is not null then 8 else 0 end
          + case when query_breed is not null and query_breed <> '' then 7 else 0 end
          + case when query_color is not null and query_color <> '' then 5 else 0 end
          + case when query_district is not null then 3 else 0 end
          + case when query_lat is not null and query_lng is not null then 2 else 0 end,
          0
        ) * 100
      )::numeric, 2)::double precision
    end as hybrid_score
  from candidates c
  where c.img_score >= min_image_similarity
  order by hybrid_score desc, (c.p).created_at desc, (c.p).id
  limit least(greatest(match_count, 1), 50);
$$;

revoke execute on function public.match_listing_pets_hybrid(
  extensions.vector, text, text, text, text, text, text, text,
  double precision, double precision, integer, double precision, boolean
) from public;
grant execute on function public.match_listing_pets_hybrid(
  extensions.vector, text, text, text, text, text, text, text,
  double precision, double precision, integer, double precision, boolean
) to anon, authenticated, service_role;

-- Preserve the previous RPC signature and its district scoring for existing callers.
create or replace function public.match_pets_hybrid(
  query_embedding extensions.vector(384),
  query_image_hash text default null,
  query_status text default null,
  query_type text default null,
  query_breed text default null,
  query_color text default null,
  query_district text default null,
  query_lat double precision default null,
  query_lng double precision default null,
  match_count integer default 20,
  min_image_similarity double precision default 0.15
)
returns table (
  pet jsonb,
  image_similarity double precision,
  hybrid_score double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select * from public.match_listing_pets_hybrid(
    query_embedding => query_embedding, query_text => null, query_image_hash => query_image_hash,
    query_status => query_status, query_type => query_type, query_breed => query_breed, query_color => query_color,
    query_district => query_district, query_lat => query_lat, query_lng => query_lng,
    match_count => match_count, min_image_similarity => min_image_similarity, filter_district => false
  );
$$;

commit;
