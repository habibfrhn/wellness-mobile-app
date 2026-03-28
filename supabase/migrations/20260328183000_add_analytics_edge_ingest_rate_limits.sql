-- Move analytics ingestion behind edge function + service role with server-side throttling.

create table if not exists public.analytics_ingest_rate_limits (
  principal_key text not null,
  action text not null,
  bucket text not null,
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (principal_key, action, bucket)
);

create index if not exists analytics_ingest_rate_limits_updated_at_idx
  on public.analytics_ingest_rate_limits (updated_at desc);

alter table public.analytics_ingest_rate_limits enable row level security;

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
  insert into public.analytics_ingest_rate_limits as rl (principal_key, action, bucket, count, updated_at)
  values (p_principal_key, p_action, p_bucket, 1, now())
  on conflict (principal_key, action, bucket)
  do update set
    count = rl.count + 1,
    updated_at = now()
  returning count;
$$;

revoke all on function public.increment_analytics_ingest_rate_limit(text, text, text) from public;
grant execute on function public.increment_analytics_ingest_rate_limit(text, text, text) to service_role;

-- Force analytics writes through edge functions/service role and keep timestamps server-sourced.
revoke insert on public.analytics_events from anon, authenticated;
revoke usage, select on sequence public.analytics_events_id_seq from anon, authenticated;

create or replace function public.set_analytics_event_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.user_id := auth.uid();
  end if;

  new.occurred_at := now();
  return new;
end;
$$;
