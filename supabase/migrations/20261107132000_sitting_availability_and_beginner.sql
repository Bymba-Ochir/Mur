-- Apply before deploying the updated sitting listing forms.
begin;

alter table public.sitting_listings
  add column available_from timestamptz,
  add column is_beginner boolean not null default false,
  add constraint sitting_available_from_supported
    check (
      available_from is null or (
        available_from >= timestamptz '0001-01-01 00:00:00+00'
        and available_from < timestamptz '10000-01-01 00:00:00+00'
      )
    );

commit;
