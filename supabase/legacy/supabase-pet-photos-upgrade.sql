-- Алдсан/олдсон зар дээр 4 хүртэл зураг хадгалах upgrade
-- Supabase Dashboard → SQL Editor дээр бүхэлд нь ажиллуулна.

alter table public.pets
  add column if not exists photo_urls jsonb not null default '[]'::jsonb;

-- Хуучин ганц зурагтай заруудыг gallery массив руу аюулгүй шилжүүлнэ.
update public.pets
set photo_urls = jsonb_build_array(photo_url)
where photo_url is not null
  and photo_url <> ''
  and jsonb_array_length(photo_urls) = 0;

-- Хамгийн ихдээ 4 URL, бүх элемент string байх ёстой.
create or replace function public.validate_pet_photo_urls()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.photo_urls is null then
    new.photo_urls := '[]'::jsonb;
  end if;
  if jsonb_typeof(new.photo_urls) <> 'array' then
    raise exception 'photo_urls массив байх ёстой';
  end if;
  if jsonb_array_length(new.photo_urls) > 4 then
    raise exception 'Хамгийн ихдээ 4 зураг оруулна';
  end if;
  if exists (select 1 from jsonb_array_elements(new.photo_urls) item where jsonb_typeof(item) <> 'string') then
    raise exception 'photo_urls зөвхөн URL текст агуулна';
  end if;
  -- Хуучин client-уудтай нийцүүлэх үндсэн зургийг автоматаар тохируулна.
  if jsonb_array_length(new.photo_urls) > 0 then
    new.photo_url := new.photo_urls ->> 0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_pet_photo_urls on public.pets;
create trigger trg_validate_pet_photo_urls
  before insert or update of photo_urls on public.pets
  for each row execute function public.validate_pet_photo_urls();

notify pgrst, 'reload schema';
