-- Reduce analytics ingest overhead by allowing batched increments and add an index
-- that matches admin dashboard query patterns (event_name + occurred_at).

create or replace function public.increment_analytics_ingest_rate_limit(
  p_principal_key text,
  p_action text,
  p_bucket text,
  p_increment int default 1
)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.analytics_ingest_rate_limits as rl (principal_key, action, bucket, count, updated_at)
  values (p_principal_key, p_action, p_bucket, greatest(coalesce(p_increment, 1), 1), now())
  on conflict (principal_key, action, bucket)
  do update set
    count = rl.count + greatest(coalesce(p_increment, 1), 1),
    updated_at = now()
  returning count;
$$;

revoke all on function public.increment_analytics_ingest_rate_limit(text, text, text, int) from public;
grant execute on function public.increment_analytics_ingest_rate_limit(text, text, text, int) to service_role;

create or replace function public.increment_analytics_ingest_rate_limit(
  p_principal_key text,
  p_action text,
  p_bucket text
)
returns int
language sql
security definer
set search_path = public
as $$
  select public.increment_analytics_ingest_rate_limit(p_principal_key, p_action, p_bucket, 1);
$$;

revoke all on function public.increment_analytics_ingest_rate_limit(text, text, text) from public;
grant execute on function public.increment_analytics_ingest_rate_limit(text, text, text) to service_role;

create index if not exists analytics_events_event_name_occurred_at_idx
  on public.analytics_events (event_name, occurred_at desc);
