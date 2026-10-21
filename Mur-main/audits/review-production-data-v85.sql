-- READ ONLY: review candidates; this script changes no production records.
-- A repeated name is not proof of a test listing.
SELECT id, name, type, created_at, resolved
FROM public.pets
WHERE id = '5d0409b9-43de-47a8-8e1f-64402299cb0a'
   OR name = 'notify-on-new-pet'
ORDER BY created_at DESC;

SELECT name, count(*) AS listing_count, array_agg(id ORDER BY created_at DESC) AS candidate_ids
FROM public.pets
WHERE name = 'Lucky Boy'
GROUP BY name;

SELECT id, name, age, created_at
FROM public.adoptions
WHERE trim(coalesce(age, '')) ~ '^[0-9]+([.,][0-9]+)?$'
ORDER BY created_at DESC;
