begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(3);

insert into auth.users(id, email) values ('f3250000-0000-4000-8000-000000000001', 'hybrid-search@example.invalid');
insert into public.pets(id, status, type, name, place, district, created_by, created_at, is_hidden, archived_at)
select ('f3250000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  case when n = 60 then 'found' else 'lost' end, 'Нохой', 'Hybrid fixture ' || n,
  case when n <= 53 then 'River' else 'Old School' end,
  case when n = 56 then 'Баянгол' else 'Хан-Уул' end,
  'f3250000-0000-4000-8000-000000000001', now() - n * interval '1 hour', n = 58, case when n = 59 then now() end
from generate_series(2, 60) n;
update public.pets
set dino_embedding = (case when place = 'Old School' and district = 'Хан-Уул' and not is_hidden
    and archived_at is null and status = 'lost' then array[0.8::real, 0.6::real] else array[1::real, 0::real] end
    || array_fill(0::real, array[382]))::extensions.vector(384), embedding_version = 'dinov2-small-q8-v1'
where created_by = 'f3250000-0000-4000-8000-000000000001';

set local role anon;
select results_eq(
  $$select pet->>'id' from public.match_listing_pets_hybrid(
    query_embedding => array_prepend(1::real, array_fill(0::real, array[383]))::extensions.vector(384),
    query_text => ' sCHOOL ', query_type => 'Нохой', query_district => 'Хан-Уул', query_status => 'found', match_count => 3
  ) order by pet->>'id'$$,
  $$values ('f3250000-0000-4000-8000-000000000054'), ('f3250000-0000-4000-8000-000000000055'), ('f3250000-0000-4000-8000-000000000057')$$,
  'text and district constrain ranking even behind more than 50 stronger nonmatching photos'
);
select is(
  (select count(*)::integer from public.match_listing_pets_hybrid(
    query_embedding => array_prepend(1::real, array_fill(0::real, array[383]))::extensions.vector(384),
    query_text => ' sCHOOL ', query_type => 'Нохой', query_district => 'Хан-Уул', query_status => 'found', match_count => 1
  )), 1, 'the filtered API still honors the requested limit'
);
select is(
  (select count(*)::integer from public.match_pets_hybrid(
    query_embedding => array_prepend(1::real, array_fill(0::real, array[383]))::extensions.vector(384),
    query_type => 'Нохой', query_status => 'found', match_count => 1
  )), 1, 'the previous RPC remains callable by existing clients'
);
reset role;
select * from finish();
rollback;
