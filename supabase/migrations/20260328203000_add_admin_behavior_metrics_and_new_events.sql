-- Expand analytics schema for product-validation behavior metrics in admin dashboard.

alter table public.analytics_events
  drop constraint if exists analytics_events_event_name_check;

alter table public.analytics_events
  add constraint analytics_events_event_name_check
  check (
    event_name in (
      'landing_page_view',
      'landing_cta_click',
      'home_sleep_cta_click',
      'audio_click',
      'signup_start',
      'signup_complete',
      'audio_play',
      'audio_complete',
      'audio_abandon',
      'tailored_session_select',
      'tailored_session_start',
      'tailored_session_complete',
      'tailored_session_dropoff'
    )
  ) not valid;

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

  if p_event_name = 'tailored_session_select' then
    return (
      coalesce(v_props ? 'session_mode', false)
      and jsonb_typeof(v_props->'session_mode') = 'string'
      and v_session_mode in ('calm_mind', 'release_accept')
    );
  end if;

  if p_event_name in ('tailored_session_start', 'tailored_session_complete', 'tailored_session_dropoff') then
    return (
      v_key_count = 0
      or (
        coalesce(v_props ? 'session_mode', false)
        and jsonb_typeof(v_props->'session_mode') = 'string'
        and v_session_mode in ('calm_mind', 'release_accept')
      )
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

-- Normalize legacy rows for stricter prop validation.
update public.analytics_events
set event_props = case
  when event_name in ('audio_click', 'audio_play', 'audio_complete', 'audio_abandon') then jsonb_build_object(
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
  when event_name in ('tailored_session_select', 'tailored_session_start', 'tailored_session_complete', 'tailored_session_dropoff') then
    case
      when trim(coalesce(event_props->>'session_mode', '')) in ('calm_mind', 'release_accept') then jsonb_build_object('session_mode', trim(event_props->>'session_mode'))
      else '{}'::jsonb
    end
  else '{}'::jsonb
end
where not public.analytics_event_props_are_valid(event_name, event_props);

alter table public.analytics_events
  validate constraint analytics_events_event_props_shape_check;

alter table public.analytics_events
  validate constraint analytics_events_event_name_check;

-- Keep insert policy aligned with the expanded event names + prop checks.
drop policy if exists "analytics_events_insert_public" on public.analytics_events;
create policy "analytics_events_insert_public"
on public.analytics_events for insert
to anon, authenticated
with check (
  event_name in (
    'landing_page_view',
    'landing_cta_click',
    'home_sleep_cta_click',
    'audio_click',
    'signup_start',
    'signup_complete',
    'audio_play',
    'audio_complete',
    'audio_abandon',
    'tailored_session_select',
    'tailored_session_start',
    'tailored_session_complete',
    'tailored_session_dropoff'
  )
  and public.analytics_event_props_are_valid(event_name, event_props)
  and char_length(session_id) between 8 and 128
  and (
    (auth.uid() is null and user_id is null)
    or (auth.uid() is not null and user_id = auth.uid())
  )
);

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
  with audio_catalog as (
    select distinct coalesce(nullif(event_props->>'audio_id', ''), 'unknown_audio') as audio_id
    from public.analytics_events
    where event_name in ('audio_click', 'audio_play', 'audio_complete', 'audio_abandon')
      and (v_start is null or occurred_at >= v_start)
  ),
  grouped as (
    select
      coalesce(nullif(event_props->>'audio_id', ''), 'unknown_audio') as grouped_audio_id,
      count(*) filter (where event_name = 'audio_click')::int as grouped_clicks,
      count(*) filter (where event_name = 'audio_play')::int as grouped_starts,
      count(*) filter (where event_name = 'audio_complete')::int as grouped_completes,
      count(*) filter (where event_name = 'audio_abandon')::int as grouped_abandons
    from public.analytics_events
    where event_name in ('audio_click', 'audio_play', 'audio_complete', 'audio_abandon')
      and (v_start is null or occurred_at >= v_start)
    group by coalesce(nullif(event_props->>'audio_id', ''), 'unknown_audio')
  )
  select
    c.audio_id,
    coalesce(g.grouped_clicks, 0) as clicks,
    coalesce(g.grouped_starts, 0) as starts,
    coalesce(g.grouped_completes, 0) as completes,
    coalesce(g.grouped_abandons, 0) as abandons,
    case when coalesce(g.grouped_starts, 0) = 0 then 0::numeric else round(coalesce(g.grouped_completes, 0)::numeric / nullif(g.grouped_starts, 0), 4) end as completion_rate
  from audio_catalog c
  left join grouped g on g.grouped_audio_id = c.audio_id
  order by coalesce(g.grouped_starts, 0) desc, c.audio_id asc;
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
  grouped as (
    select
      event_props->>'session_mode' as mode_key,
      count(*) filter (where event_name = 'tailored_session_select')::int as grouped_selections,
      count(*) filter (where event_name = 'tailored_session_start')::int as grouped_starts,
      count(*) filter (where event_name = 'tailored_session_complete')::int as grouped_completes,
      count(*) filter (where event_name = 'tailored_session_dropoff')::int as grouped_dropoffs
    from public.analytics_events
    where event_name in ('tailored_session_select', 'tailored_session_start', 'tailored_session_complete', 'tailored_session_dropoff')
      and (v_start is null or occurred_at >= v_start)
      and event_props->>'session_mode' in ('calm_mind', 'release_accept')
    group by event_props->>'session_mode'
  )
  select
    m.session_mode,
    coalesce(g.grouped_selections, 0) as selections,
    coalesce(g.grouped_starts, 0) as starts,
    coalesce(g.grouped_completes, 0) as completes,
    coalesce(g.grouped_dropoffs, 0) as dropoffs,
    case when coalesce(g.grouped_starts, 0) = 0 then 0::numeric else round(coalesce(g.grouped_completes, 0)::numeric / nullif(g.grouped_starts, 0), 4) end as completion_rate
  from modes m
  left join grouped g on g.mode_key = m.session_mode
  order by m.session_mode asc;
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
  select
    count(*) filter (where event_name = 'home_sleep_cta_click')::int as home_sleep_clicks,
    count(*) filter (where event_name = 'tailored_session_select')::int as tailored_session_selections,
    count(*) filter (where event_name = 'tailored_session_start')::int as tailored_session_starts
  from public.analytics_events
  where event_name in ('home_sleep_cta_click', 'tailored_session_select', 'tailored_session_start')
    and (v_start is null or occurred_at >= v_start);
end;
$$;

revoke all on function public.admin_analytics_audio_engagement(text) from public;
revoke all on function public.admin_analytics_tailored_sessions(text) from public;
revoke all on function public.admin_analytics_product_actions(text) from public;

grant execute on function public.admin_analytics_audio_engagement(text) to authenticated;
grant execute on function public.admin_analytics_tailored_sessions(text) to authenticated;
grant execute on function public.admin_analytics_product_actions(text) to authenticated;
