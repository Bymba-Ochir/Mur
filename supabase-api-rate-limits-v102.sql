-- PRE-DEPLOY. Run manually in Supabase SQL Editor before deploying v102 code.
-- Service-only shared quotas. No application rows or existing RLS are changed.
begin;

create table if not exists public.api_rate_limit_buckets (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  request_count integer not null check (request_count between 1 and 1001),
  reset_at timestamptz not null
);
create index if not exists api_rate_limit_buckets_reset_at_idx
  on public.api_rate_limit_buckets (reset_at);

alter table public.api_rate_limit_buckets enable row level security;
revoke all on table public.api_rate_limit_buckets from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(
  bucket_key text,
  max_requests integer,
  window_seconds integer
)
returns table(allowed boolean, retry_after_seconds integer, remaining integer)
language plpgsql volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  request_time timestamptz := clock_timestamp();
  hit_count integer;
  resets_at timestamptz;
begin
  if bucket_key is null or bucket_key !~ '^[0-9a-f]{64}$'
    or max_requests is null or max_requests not between 1 and 1000
    or window_seconds is null or window_seconds not between 1 and 86400 then
    raise exception 'INVALID_RATE_LIMIT_ARGUMENTS' using errcode = '22023';
  end if;

  -- Bounded expiry cleanup; SKIP LOCKED avoids waiting for another worker.
  with expired as (
    select b.key_hash from public.api_rate_limit_buckets b
    where b.reset_at < request_time - interval '1 day'
    order by b.reset_at
    limit 20 for update skip locked
  )
  delete from public.api_rate_limit_buckets b using expired e where b.key_hash = e.key_hash;

  -- The unique key and atomic upsert serialize concurrent requests across
  -- serverless instances. Saturation prevents blocked hits from overflowing.
  insert into public.api_rate_limit_buckets as b (key_hash, request_count, reset_at)
  values (bucket_key, 1, request_time + make_interval(secs => window_seconds))
  on conflict (key_hash) do update set
    request_count = case when b.reset_at <= request_time then 1
      else least(b.request_count + 1, max_requests + 1) end,
    reset_at = case when b.reset_at <= request_time
      then request_time + make_interval(secs => window_seconds) else b.reset_at end
  returning b.request_count, b.reset_at into hit_count, resets_at;

  return query select
    hit_count <= max_requests,
    case when hit_count <= max_requests then 0
      else greatest(1, ceil(extract(epoch from resets_at - request_time))::integer) end,
    greatest(0, max_requests - hit_count);
end;
$$;

revoke all on function public.consume_api_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text,integer,integer) to service_role;

notify pgrst, 'reload schema';
commit;
