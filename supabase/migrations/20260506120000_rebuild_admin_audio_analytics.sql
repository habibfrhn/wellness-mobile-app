-- Rebuild admin audio analytics around durable audio play sessions.
-- A play session starts on the first "Mulai" press for one audio lifecycle and
-- can be marked finished once when playback reaches at least 80% progress.

create table if not exists public.audio_play_sessions (
  play_session_id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  app_session_id text not null,
  audio_id text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  finish_progress numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint audio_play_sessions_play_session_id_length check (char_length(play_session_id) between 8 and 128),
  constraint audio_play_sessions_app_session_id_length check (char_length(app_session_id) between 8 and 128),
  constraint audio_play_sessions_audio_id_valid check (char_length(audio_id) between 1 and 120 and audio_id ~ '^[A-Za-z0-9_-]+$'),
  constraint audio_play_sessions_finish_progress_valid check (finish_progress is null or (finish_progress >= 0.8 and finish_progress <= 1.0)),
  constraint audio_play_sessions_finished_at_requires_progress check ((finished_at is null and finish_progress is null) or (finished_at is not null and finish_progress is not null))
);

alter table public.audio_play_sessions enable row level security;

grant select, insert, update on public.audio_play_sessions to service_role;
revoke all on public.audio_play_sessions from anon, authenticated;

drop policy if exists "audio_play_sessions_no_direct_client_access" on public.audio_play_sessions;
create policy "audio_play_sessions_no_direct_client_access"
on public.audio_play_sessions
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists audio_play_sessions_started_at_idx
  on public.audio_play_sessions (started_at desc);

create index if not exists audio_play_sessions_finished_at_idx
  on public.audio_play_sessions (finished_at desc)
  where finished_at is not null;

create index if not exists audio_play_sessions_audio_started_idx
  on public.audio_play_sessions (audio_id, started_at desc);

create index if not exists audio_play_sessions_audio_finished_idx
  on public.audio_play_sessions (audio_id, finished_at desc)
  where finished_at is not null;

create or replace function public.analytics_range_start(range_key text)
returns timestamptz
language sql
stable
as $$
  select case lower(coalesce(range_key, '7d'))
    when 'today' then date_trunc('day', now())
    when '7d' then now() - interval '7 days'
    when '1m' then now() - interval '1 month'
    when '30d' then now() - interval '1 month'
    when '3m' then now() - interval '3 months'
    when '90d' then now() - interval '3 months'
    when '6m' then now() - interval '6 months'
    when '1y' then now() - interval '1 year'
    when '12m' then now() - interval '1 year'
    when 'all' then null
    else now() - interval '7 days'
  end;
$$;

create or replace function public.admin_audio_usage_analytics(range_key text default '7d')
returns table(
  audio_id text,
  starts int,
  finishes int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz := public.analytics_range_start(range_key);
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  return query
  with started as (
    select
      aps.audio_id,
      count(*)::int as starts
    from public.audio_play_sessions aps
    where v_start is null or aps.started_at >= v_start
    group by aps.audio_id
  ),
  finished as (
    select
      aps.audio_id,
      count(*)::int as finishes
    from public.audio_play_sessions aps
    where aps.finished_at is not null
      and (v_start is null or aps.finished_at >= v_start)
    group by aps.audio_id
  ),
  audio_ids as (
    select audio_id from started
    union
    select audio_id from finished
  )
  select
    ids.audio_id,
    coalesce(s.starts, 0) as starts,
    coalesce(f.finishes, 0) as finishes
  from audio_ids ids
  left join started s on s.audio_id = ids.audio_id
  left join finished f on f.audio_id = ids.audio_id
  order by coalesce(s.starts, 0) desc, coalesce(f.finishes, 0) desc, ids.audio_id asc;
end;
$$;

revoke all on function public.admin_audio_usage_analytics(text) from public;
grant execute on function public.admin_audio_usage_analytics(text) to authenticated;
