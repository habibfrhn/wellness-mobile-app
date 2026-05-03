create table if not exists public.request_rate_limits (
  principal_key text not null,
  action text not null,
  window_started_at timestamptz not null,
  window_seconds int not null check (window_seconds > 0),
  count int not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (principal_key, action, window_started_at, window_seconds)
);

create index if not exists request_rate_limits_updated_at_idx
  on public.request_rate_limits (updated_at desc);

alter table public.request_rate_limits enable row level security;

create or replace function public.check_and_increment_rate_limit(
  p_principal_key text,
  p_action text,
  p_window_seconds int,
  p_limit int,
  p_now timestamptz default now(),
  p_increment int default 1
)
returns table (
  allowed boolean,
  current_count int,
  limit_value int,
  remaining int,
  retry_after_seconds int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_started_at timestamptz;
  v_count int;
  v_window_elapsed int;
begin
  if p_principal_key is null or length(trim(p_principal_key)) = 0 then
    raise exception 'p_principal_key is required';
  end if;

  if p_action is null or length(trim(p_action)) = 0 then
    raise exception 'p_action is required';
  end if;

  if p_window_seconds <= 0 or p_limit <= 0 or p_increment <= 0 then
    raise exception 'window, limit, and increment must be positive integers';
  end if;

  v_window_started_at := to_timestamp(floor(extract(epoch from p_now) / p_window_seconds) * p_window_seconds);

  insert into public.request_rate_limits as rl (
    principal_key,
    action,
    window_started_at,
    window_seconds,
    count,
    updated_at
  )
  values (
    p_principal_key,
    p_action,
    v_window_started_at,
    p_window_seconds,
    p_increment,
    p_now
  )
  on conflict (principal_key, action, window_started_at, window_seconds)
  do update set
    count = rl.count + p_increment,
    updated_at = p_now
  returning rl.count into v_count;

  v_window_elapsed := floor(extract(epoch from (p_now - v_window_started_at)));

  return query
  select
    v_count <= p_limit,
    v_count,
    p_limit,
    greatest(p_limit - v_count, 0),
    greatest(p_window_seconds - v_window_elapsed, 1);
end;
$$;

revoke all on function public.check_and_increment_rate_limit(text, text, int, int, timestamptz, int) from public;
grant execute on function public.check_and_increment_rate_limit(text, text, int, int, timestamptz, int) to service_role;
