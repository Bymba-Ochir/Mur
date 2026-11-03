begin;

create table public.site_feedback (
  id uuid primary key,
  category text not null check (category in ('suggestion', 'bug', 'other')),
  message text not null check (char_length(btrim(message)) between 10 and 2000),
  page text not null check (page ~ '^/([a-z0-9-]{1,48})?$'),
  created_at timestamptz not null default now()
);

create index site_feedback_latest_idx on public.site_feedback (created_at desc, id desc);

alter table public.site_feedback enable row level security;
revoke all on table public.site_feedback from public, anon, authenticated, service_role;
grant select on table public.site_feedback to authenticated;
grant select, insert on table public.site_feedback to service_role;

create policy "Admins read site feedback"
  on public.site_feedback for select to authenticated
  using ((select public.is_current_admin()));

commit;
