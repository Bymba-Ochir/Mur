-- Үрчлүүлэх зар дээр 4 хүртэл зураг хадгалах шинэчлэл.
-- Supabase SQL Editor дээр нэг удаа ажиллуулна.
alter table public.adoptions
  add column if not exists photo_urls jsonb not null default '[]'::jsonb;

update public.adoptions
set photo_urls = jsonb_build_array(photo_url)
where photo_url is not null
  and jsonb_array_length(photo_urls) = 0;
