-- READ ONLY. Never call a claim RPC as a verification SELECT: it claims work.
-- All rows below should report passed = true after the pre-deploy migration.
with functions(signature) as (
  values
    ('public.claim_due_vaccine_reminders_with_subscriptions(integer)'),
    ('public.claim_due_medication_reminders_with_subscriptions(integer)')
)
select signature as check_name,
       to_regprocedure(signature) is not null
       and coalesce(has_function_privilege('service_role', to_regprocedure(signature), 'execute'), false)
       and not coalesce(has_function_privilege('anon', to_regprocedure(signature), 'execute'), true)
       and not coalesce(has_function_privilege('authenticated', to_regprocedure(signature), 'execute'), true)
       as passed
from functions
union all
select 'push_subscriptions_user_id_id_idx',
       exists (
         select 1 from pg_index
         where indexrelid = to_regclass('public.push_subscriptions_user_id_id_idx')
           and indisvalid and indisready
       );
