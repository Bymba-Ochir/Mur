-- Rebuild DINOv2 when a backfill binds a new source or has no usable vector.
begin;

create or replace function public.queue_missing_pet_cover_fingerprints()
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare candidate record; revision uuid;
begin
  for candidate in
    select p.id, p.embedding_revision, cover.url,
      (
        p.embedding_revision is not null
        and p.embedding_photo_url is not distinct from cover.url
        and p.dino_embedding is not null
        and p.embedding_version is not distinct from 'dinov2-small-q8-v1'
      ) as cover_only,
      (
        p.embedding_revision is null
        or p.embedding_photo_url is distinct from cover.url
      ) as rebind
    from public.pets p
    cross join lateral (
      select pp.url from public.pet_photos pp where pp.pet_id = p.id order by pp.position limit 1
    ) cover
    left join public.background_jobs previous on previous.dedupe_key = 'pet-cover:' || p.embedding_revision::text
    where not p.resolved and not p.is_hidden and p.archived_at is null
      and (previous.id is null or previous.status = 'done')
      and (
        p.cover_fingerprint is null
        or (
          previous.payload->>'coverOnly' = 'true'
          and (p.dino_embedding is null or p.embedding_version is distinct from 'dinov2-small-q8-v1')
        )
      )
      and not exists (
        select 1 from public.background_jobs j
        where j.dedupe_key = 'pet-cover-v2:' || p.embedding_revision::text
          or (j.dedupe_key = 'pet-image:' || p.embedding_revision::text and j.status in ('pending', 'running'))
      )
    order by p.created_at desc, p.id
    limit 3 for update of p skip locked
  loop
    revision := candidate.embedding_revision;
    if candidate.rebind then
      revision := gen_random_uuid();
      update public.pets set embedding_revision = revision, embedding_photo_url = candidate.url,
        dino_embedding = null, color_signature = null, embedding_version = null, image_hash = null
        where id = candidate.id;
    end if;
    perform public.enqueue_background_job('pet-image-embedding', 'pet-cover-v2:' || revision::text,
      jsonb_build_object('petId', candidate.id, 'revision', revision, 'coverOnly', candidate.cover_only));
  end loop;
end;
$$;

commit;
