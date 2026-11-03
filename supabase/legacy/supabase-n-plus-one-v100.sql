-- PRE-DEPLOY: run manually after supabase-race-condition-hardening-v99.sql.
-- Additive wrappers preserve v99's FOR UPDATE SKIP LOCKED / claim-date guards.
-- Deploy code only after this transaction succeeds. No production data rewrite.
begin;

create index if not exists push_subscriptions_user_id_id_idx
  on public.push_subscriptions (user_id, id);

create or replace function public.claim_due_vaccine_reminders_with_subscriptions(max_rows integer default 100)
returns table(id uuid, user_id uuid, name text, next_vaccine_date date, last_notified_date date, subscriptions jsonb)
language sql volatile
security invoker
set search_path = public
as $$
  select c.*, coalesce(s.subscriptions, '[]'::jsonb)
  from public.claim_due_vaccine_reminders(greatest(1, least(coalesce(max_rows, 100), 100))) c
  left join lateral (
    select jsonb_agg(jsonb_build_object('endpoint', p.endpoint, 'keys', p.keys) order by p.id) as subscriptions
    from (
      select ps.id, ps.endpoint, ps.keys
      from public.push_subscriptions ps
      where ps.user_id = c.user_id
      order by ps.id
      limit 50
    ) p
  ) s on true
  order by c.id;
$$;

revoke all on function public.claim_due_vaccine_reminders_with_subscriptions(integer) from public, anon, authenticated;
grant execute on function public.claim_due_vaccine_reminders_with_subscriptions(integer) to service_role;

create or replace function public.claim_due_medication_reminders_with_subscriptions(max_rows integer default 100)
returns table(id uuid, user_id uuid, pet_name text, name text, dosage text, next_reminder_date date, last_notified_date date, subscriptions jsonb)
language sql volatile
security invoker
set search_path = public
as $$
  select c.*, coalesce(s.subscriptions, '[]'::jsonb)
  from public.claim_due_medication_reminders(greatest(1, least(coalesce(max_rows, 100), 100))) c
  left join lateral (
    select jsonb_agg(jsonb_build_object('endpoint', p.endpoint, 'keys', p.keys) order by p.id) as subscriptions
    from (
      select ps.id, ps.endpoint, ps.keys
      from public.push_subscriptions ps
      where ps.user_id = c.user_id
      order by ps.id
      limit 50
    ) p
  ) s on true
  order by c.id;
$$;

revoke all on function public.claim_due_medication_reminders_with_subscriptions(integer) from public, anon, authenticated;
grant execute on function public.claim_due_medication_reminders_with_subscriptions(integer) to service_role;

notify pgrst, 'reload schema';
commit;
