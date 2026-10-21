-- Supabase Dashboard → SQL Editor дээр нэг удаа ажиллуулна.
-- Алдсан/олдсон амьтны бүртгэлд үүлдэр хадгалах багана нэмнэ.
alter table public.pets add column if not exists breed text default '';

-- Үүлдрээр хайх ажиллагааг өгөгдөл өссөн үед дэмжинэ.
create index if not exists pets_breed_idx on public.pets (breed);
