-- Fix admin audio usage RPC ambiguity and keep the dashboard query stable.
-- The previous function used unqualified output-column names inside CTEs, which
-- can raise ambiguous-column errors in PL/pgSQL and surface as a generic
-- dashboard load failure.

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
      aps.audio_id as grouped_audio_id,
      count(*)::int as grouped_starts
    from public.audio_play_sessions aps
    where v_start is null or aps.started_at >= v_start
    group by aps.audio_id
  ),
  finished as (
    select
      aps.audio_id as grouped_audio_id,
      count(*)::int as grouped_finishes
    from public.audio_play_sessions aps
    where aps.finished_at is not null
      and (v_start is null or aps.finished_at >= v_start)
    group by aps.audio_id
  ),
  audio_ids as (
    select started.grouped_audio_id from started
    union
    select finished.grouped_audio_id from finished
  )
  select
    ids.grouped_audio_id as audio_id,
    coalesce(s.grouped_starts, 0) as starts,
    coalesce(f.grouped_finishes, 0) as finishes
  from audio_ids ids
  left join started s on s.grouped_audio_id = ids.grouped_audio_id
  left join finished f on f.grouped_audio_id = ids.grouped_audio_id
  order by coalesce(s.grouped_starts, 0) desc, coalesce(f.grouped_finishes, 0) desc, ids.grouped_audio_id asc;
end;
$$;

revoke all on function public.admin_audio_usage_analytics(text) from public;
grant execute on function public.admin_audio_usage_analytics(text) to authenticated;
