-- READ ONLY. Do not call consume_api_rate_limit() to audit production: it writes.
-- Every row should report passed=true after the pre-deploy migration.
select 'rate_counter_rls_enabled' as check_name,
  exists(select 1 from pg_class where oid=to_regclass('public.api_rate_limit_buckets') and relrowsecurity) as passed
union all
select 'rate_counter_private',
  to_regclass('public.api_rate_limit_buckets') is not null
  and not coalesce(has_table_privilege('anon',to_regclass('public.api_rate_limit_buckets'),'SELECT,INSERT,UPDATE,DELETE'),true)
  and not coalesce(has_table_privilege('authenticated',to_regclass('public.api_rate_limit_buckets'),'SELECT,INSERT,UPDATE,DELETE'),true)
union all
select 'rate_counter_rpc_service_only',
  to_regprocedure('public.consume_api_rate_limit(text,integer,integer)') is not null
  and coalesce(has_function_privilege('service_role',to_regprocedure('public.consume_api_rate_limit(text,integer,integer)'),'EXECUTE'),false)
  and not coalesce(has_function_privilege('anon',to_regprocedure('public.consume_api_rate_limit(text,integer,integer)'),'EXECUTE'),true)
  and not coalesce(has_function_privilege('authenticated',to_regprocedure('public.consume_api_rate_limit(text,integer,integer)'),'EXECUTE'),true)
union all
select 'rate_counter_expiry_index',
  exists(select 1 from pg_index where indexrelid=to_regclass('public.api_rate_limit_buckets_reset_at_idx') and indisvalid and indisready);
