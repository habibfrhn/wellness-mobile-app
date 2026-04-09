-- Rebuild analytics validation + admin aggregations for production reliability.
-- 1) Require a valid session_mode for every tailored-session event.
-- 2) Normalize legacy data that no longer satisfies strict event schema.
-- 3) Keep admin metrics consistent and index-backed for common range filters.

create or replace function public.analytics_event_props_are_valid(p_event_name text, p_event_props jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  v_props jsonb := coalesce(p_event_props, '{}'::jsonb);
  v_key_count int := 0;
  v_session_mode text := trim(coalesce(v_props->>'session_mode', ''));
begin
  if jsonb_typeof(v_props) <> 'object' then
    return false;
  end if;

  select count(*) into v_key_count
  from jsonb_object_keys(v_props);

  if v_key_count > 1 then
    return false;
  end if;

  if p_event_name in ('audio_click', 'audio_play', 'audio_complete', 'audio_abandon') then
    return (
      coalesce(v_props ? 'audio_id', false)
      and jsonb_typeof(v_props->'audio_id') = 'string'
      and char_length(trim(v_props->>'audio_id')) between 1 and 120
      and trim(v_props->>'audio_id') ~ '^[A-Za-z0-9_-]+$'
    );
  end if;

  if p_event_name in ('tailored_session_select', 'tailored_session_start', 'tailored_session_complete', 'tailored_session_dropoff') then
    return (
      coalesce(v_props ? 'session_mode', false)
      and jsonb_typeof(v_props->'session_mode') = 'string'
      and v_session_mode in ('calm_mind', 'release_accept')
    );
  end if;

  return v_key_count = 0;
end;
$$;

alter table public.analytics_events
  drop constraint if exists analytics_events_event_props_shape_check;

alter table public.analytics_events
  add constraint analytics_events_event_props_shape_check
  check (public.analytics_event_props_are_valid(event_name, event_props)) not valid;

-- For strict tailored-session semantics we drop legacy rows that cannot be attributed to a mode.
delete from public.analytics_events
where event_name in ('tailored_session_select', 'tailored_session_start', 'tailored_session_complete', 'tailored_session_dropoff')
  and not public.analytics_event_props_are_valid(event_name, event_props);

-- Keep audio IDs normalized for any older malformed rows.
update public.analytics_events
set event_props = jsonb_build_object(
  'audio_id',
  coalesce(
    nullif(
      regexp_replace(
        lower(trim(coalesce(event_props->>'audio_id', 'unknown_audio'))),
        '[^a-z0-9_-]',
        '',
        'g'
      ),
      ''
    ),
    'unknown_audio'
  )
)
where event_name in ('audio_click', 'audio_play', 'audio_complete', 'audio_abandon')
  and not public.analytics_event_props_are_valid(event_name, event_props);

alter table public.analytics_events
  validate constraint analytics_events_event_props_shape_check;

create or replace function public.admin_analytics_audio_engagement(range_key text default '30d')
returns table(
  audio_id text,
  clicks int,
  starts int,
  completes int,
  abandons int,
  completion_rate numeric
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
  with filtered as (
    select
      coalesce(nullif(event_props->>'audio_id', ''), 'unknown_audio') as audio_id,
      event_name
    from public.analytics_events
    where event_name in ('audio_click', 'audio_play', 'audio_complete', 'audio_abandon')
      and (v_start is null or occurred_at >= v_start)
  )
  select
    filtered.audio_id,
    count(*) filter (where filtered.event_name = 'audio_click')::int as clicks,
    count(*) filter (where filtered.event_name = 'audio_play')::int as starts,
    count(*) filter (where filtered.event_name = 'audio_complete')::int as completes,
    count(*) filter (where filtered.event_name = 'audio_abandon')::int as abandons,
    case
      when count(*) filter (where filtered.event_name = 'audio_play') = 0 then 0::numeric
      else round(
        (count(*) filter (where filtered.event_name = 'audio_complete'))::numeric /
        nullif(count(*) filter (where filtered.event_name = 'audio_play'), 0),
        4
      )
    end as completion_rate
  from filtered
  group by filtered.audio_id
  order by starts desc, filtered.audio_id asc;
end;
$$;

create or replace function public.admin_analytics_tailored_sessions(range_key text default '30d')
returns table(
  session_mode text,
  selections int,
  starts int,
  completes int,
  dropoffs int,
  completion_rate numeric
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
  with modes as (
    select 'calm_mind'::text as session_mode
    union all
    select 'release_accept'::text as session_mode
  ),
  filtered as (
    select
      event_props->>'session_mode' as session_mode,
      event_name
    from public.analytics_events
    where event_name in ('tailored_session_select', 'tailored_session_start', 'tailored_session_complete', 'tailored_session_dropoff')
      and (v_start is null or occurred_at >= v_start)
      and event_props->>'session_mode' in ('calm_mind', 'release_accept')
  ),
  grouped as (
    select
      filtered.session_mode,
      count(*) filter (where filtered.event_name = 'tailored_session_select')::int as selections,
      count(*) filter (where filtered.event_name = 'tailored_session_start')::int as starts,
      count(*) filter (where filtered.event_name = 'tailored_session_complete')::int as completes,
      count(*) filter (where filtered.event_name = 'tailored_session_dropoff')::int as dropoffs
    from filtered
    group by filtered.session_mode
  )
  select
    modes.session_mode,
    coalesce(grouped.selections, 0) as selections,
    coalesce(grouped.starts, 0) as starts,
    coalesce(grouped.completes, 0) as completes,
    coalesce(grouped.dropoffs, 0) as dropoffs,
    case
      when coalesce(grouped.starts, 0) = 0 then 0::numeric
      else round(coalesce(grouped.completes, 0)::numeric / nullif(grouped.starts, 0), 4)
    end as completion_rate
  from modes
  left join grouped on grouped.session_mode = modes.session_mode
  order by modes.session_mode asc;
end;
$$;

create or replace function public.admin_analytics_product_actions(range_key text default '30d')
returns table(
  home_sleep_clicks int,
  tailored_session_selections int,
  tailored_session_starts int
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
  with filtered as (
    select event_name
    from public.analytics_events
    where event_name in ('home_sleep_cta_click', 'tailored_session_select', 'tailored_session_start')
      and (v_start is null or occurred_at >= v_start)
  )
  select
    count(*) filter (where filtered.event_name = 'home_sleep_cta_click')::int as home_sleep_clicks,
    count(*) filter (where filtered.event_name = 'tailored_session_select')::int as tailored_session_selections,
    count(*) filter (where filtered.event_name = 'tailored_session_start')::int as tailored_session_starts
  from filtered;
end;
$$;

create index if not exists analytics_events_audio_id_event_time_idx
  on public.analytics_events ((event_props->>'audio_id'), occurred_at desc)
  where event_name in ('audio_click', 'audio_play', 'audio_complete', 'audio_abandon');

create index if not exists analytics_events_session_mode_event_time_idx
  on public.analytics_events ((event_props->>'session_mode'), occurred_at desc)
  where event_name in ('tailored_session_select', 'tailored_session_start', 'tailored_session_complete', 'tailored_session_dropoff');
