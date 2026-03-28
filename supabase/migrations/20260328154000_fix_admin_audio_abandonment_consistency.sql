-- Keep audio abandonment definitions consistent across KPI and table metrics.
-- Also ensure rows still appear when older events are missing audio_id.

create or replace function public.admin_analytics_audio_summary(range_key text default '30d')
returns table(
  audio_id text,
  plays int,
  completes int,
  abandons int,
  completion_rate numeric,
  abandon_rate numeric
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
  with grouped as (
    select
      coalesce(nullif(event_props->>'audio_id', ''), 'unknown_audio') as grouped_audio_id,
      count(*) filter (where event_name = 'audio_play')::int as grouped_plays,
      count(*) filter (where event_name = 'audio_complete')::int as grouped_completes
    from public.analytics_events
    where event_name in ('audio_play', 'audio_complete', 'audio_abandon')
      and (v_start is null or occurred_at >= v_start)
    group by coalesce(nullif(event_props->>'audio_id', ''), 'unknown_audio')
  )
  select
    grouped_audio_id as audio_id,
    grouped_plays as plays,
    grouped_completes as completes,
    greatest(grouped_plays - grouped_completes, 0) as abandons,
    case when grouped_plays = 0 then 0::numeric else round(grouped_completes::numeric / nullif(grouped_plays, 0), 4) end as completion_rate,
    case when grouped_plays = 0 then 0::numeric else round(greatest(grouped_plays - grouped_completes, 0)::numeric / nullif(grouped_plays, 0), 4) end as abandon_rate
  from grouped
  order by grouped_plays desc, grouped_audio_id asc;
end;
$$;
