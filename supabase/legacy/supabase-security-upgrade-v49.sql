-- МӨР v49 — public write hardening
-- Supabase SQL Editor дээр нэг удаа ажиллуулна. Өгөгдөл устгахгүй.

begin;

-- Browser дахь anon key-ээр server API болон rate limit-ийг тойрч бичих хуучин
-- policy-уудыг хаана. Service role эдгээр RLS policy-г тойрч зөвшөөрөгдсөн API
-- route-уудаар бичих тул хэрэглэгчийн хэвийн ажиллагаа үргэлжилнэ.
drop policy if exists "Anyone can subscribe" on public.push_subscriptions;
drop policy if exists "Anyone can report" on public.reports;
drop policy if exists "Anyone can add sighting" on public.sightings;
drop policy if exists "Anyone can create donation" on public.donations;

revoke insert on table public.push_subscriptions from anon, authenticated;
revoke insert on table public.reports from anon, authenticated;
revoke insert on table public.sightings from anon, authenticated;
revoke insert on table public.donations from anon, authenticated;

-- Public унших шаардлагатай өгөгдлийг өөрчлөхгүй:
-- sightings select, paid donations select болон public listing select хэвээр.

commit;

notify pgrst, 'reload schema';
