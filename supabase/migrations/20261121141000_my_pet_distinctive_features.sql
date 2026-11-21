begin;

-- Optional reusable identification details; existing pets need no backfill.
-- The existing owner-only RLS on my_pets also protects this column.
alter table public.my_pets
  add column if not exists markings text
  constraint my_pets_markings_length check (char_length(markings) <= 100);

comment on column public.my_pets.markings is
  'Owner-managed distinctive features to copy into a lost report after confirmation.';

commit;
notify pgrst, 'reload schema';
