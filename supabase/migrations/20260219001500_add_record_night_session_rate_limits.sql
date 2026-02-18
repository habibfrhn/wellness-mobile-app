create table if not exists public.rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  bucket text not null,
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, action, bucket)
);

create index if not exists rate_limits_action_bucket_idx
  on public.rate_limits (action, bucket);

create index if not exists rate_limits_updated_at_idx
  on public.rate_limits (updated_at desc);

alter table public.rate_limits enable row level security;

create or replace function public.increment_rate_limit(
  p_user_id uuid,
  p_action text,
  p_bucket text
)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.rate_limits as rl (user_id, action, bucket, count, updated_at)
  values (p_user_id, p_action, p_bucket, 1, now())
  on conflict (user_id, action, bucket)
  do update set
    count = rl.count + 1,
    updated_at = now()
  returning count;
$$;

revoke all on function public.increment_rate_limit(uuid, text, text) from public;
grant execute on function public.increment_rate_limit(uuid, text, text) to service_role;

drop policy if exists "night_sessions_insert_own" on public.night_sessions;
drop policy if exists "night_sessions_update_own" on public.night_sessions;
drop policy if exists "night_sessions_delete_own" on public.night_sessions;
