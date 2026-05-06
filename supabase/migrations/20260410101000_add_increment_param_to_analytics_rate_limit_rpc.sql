-- Ensure analytics ingest rate-limit RPC supports batched increments from edge functions.
-- This prevents RATE_LIMIT_FAILED responses when older DB environments only have the 3-arg signature.
-- Drop overloads first because Postgres cannot remove a default parameter with
-- CREATE OR REPLACE FUNCTION when the previously-applied 4-arg RPC used
-- p_increment int default 1. The 3-arg wrapper depends on the 4-arg RPC, so it
-- must be dropped before rebuilding the canonical signatures.

drop function if exists public.increment_analytics_ingest_rate_limit(text, text, text);
drop function if exists public.increment_analytics_ingest_rate_limit(text, text, text, int);

create function public.increment_analytics_ingest_rate_limit(
  p_principal_key text,
  p_action text,
  p_bucket text,
  p_increment int
)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.analytics_ingest_rate_limits as rl (principal_key, action, bucket, count, updated_at)
  values (
    p_principal_key,
    p_action,
    p_bucket,
    greatest(coalesce(p_increment, 1), 1),
    now()
  )
  on conflict (principal_key, action, bucket)
  do update set
    count = rl.count + greatest(coalesce(p_increment, 1), 1),
    updated_at = now()
  returning count;
$$;

create function public.increment_analytics_ingest_rate_limit(
  p_principal_key text,
  p_action text,
  p_bucket text
)
returns int
language sql
security definer
set search_path = public
as $$
  select public.increment_analytics_ingest_rate_limit(
    p_principal_key,
    p_action,
    p_bucket,
    1
  );
$$;

revoke all on function public.increment_analytics_ingest_rate_limit(text, text, text, int) from public;
revoke all on function public.increment_analytics_ingest_rate_limit(text, text, text) from public;
grant execute on function public.increment_analytics_ingest_rate_limit(text, text, text, int) to service_role;
grant execute on function public.increment_analytics_ingest_rate_limit(text, text, text) to service_role;
