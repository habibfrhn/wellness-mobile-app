-- Simplify admin analytics to reliable metrics and add monthly comparison data.

create or replace function public.analytics_range_start(range_key text)
returns timestamptz
language sql
stable
as $$
  select case lower(coalesce(range_key, '30d'))
    when '1d' then now() - interval '1 day'
    when '7d' then now() - interval '7 days'
    when '30d' then now() - interval '30 days'
    when '1m' then now() - interval '1 month'
    else now() - interval '30 days'
  end;
$$;

create or replace function public.admin_analytics_product_actions(range_key text default '30d')
returns table(
  home_sleep_clicks int
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
    count(*) filter (where event_name = 'home_sleep_cta_click')::int as home_sleep_clicks
  from public.analytics_events
  where event_name = 'home_sleep_cta_click'
    and occurred_at >= v_start;
end;
$$;

create or replace function public.admin_analytics_tailored_sessions(range_key text default '30d')
returns table(
  session_mode text,
  selections int,
  starts int,
  completes int
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
      count(*) filter (where event_name = 'tailored_session_complete')::int as grouped_completes
    from public.analytics_events
    where event_name in ('tailored_session_select', 'tailored_session_start', 'tailored_session_complete')
      and occurred_at >= v_start
      and event_props->>'session_mode' in ('calm_mind', 'release_accept')
    group by event_props->>'session_mode'
  )
  select
    m.session_mode,
    coalesce(g.grouped_selections, 0) as selections,
    coalesce(g.grouped_starts, 0) as starts,
    coalesce(g.grouped_completes, 0) as completes
  from modes m
  left join grouped g on g.mode_key = m.session_mode
  order by m.session_mode asc;
end;
$$;

create or replace function public.admin_analytics_monthly_comparison(months_back int default 6)
returns table(
  month_start date,
  home_sleep_clicks int,
  audio_starts int,
  audio_completes int,
  tailored_starts int,
  tailored_completes int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_months_back int := greatest(2, least(coalesce(months_back, 6), 24));
  v_first_month date := (date_trunc('month', now())::date - ((v_months_back - 1) * interval '1 month'))::date;
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  return query
  with months as (
    select generate_series(v_first_month, date_trunc('month', now())::date, interval '1 month')::date as month_start
  ),
  grouped as (
    select
      date_trunc('month', occurred_at)::date as grouped_month,
      count(*) filter (where event_name = 'home_sleep_cta_click')::int as grouped_home_sleep_clicks,
      count(*) filter (where event_name = 'audio_play')::int as grouped_audio_starts,
      count(*) filter (where event_name = 'audio_complete')::int as grouped_audio_completes,
      count(*) filter (where event_name = 'tailored_session_start')::int as grouped_tailored_starts,
      count(*) filter (where event_name = 'tailored_session_complete')::int as grouped_tailored_completes
    from public.analytics_events
    where occurred_at >= v_first_month
      and event_name in (
        'home_sleep_cta_click',
        'audio_play',
        'audio_complete',
        'tailored_session_start',
        'tailored_session_complete'
      )
    group by date_trunc('month', occurred_at)::date
  )
  select
    m.month_start,
    coalesce(g.grouped_home_sleep_clicks, 0) as home_sleep_clicks,
    coalesce(g.grouped_audio_starts, 0) as audio_starts,
    coalesce(g.grouped_audio_completes, 0) as audio_completes,
    coalesce(g.grouped_tailored_starts, 0) as tailored_starts,
    coalesce(g.grouped_tailored_completes, 0) as tailored_completes
  from months m
  left join grouped g on g.grouped_month = m.month_start
  order by m.month_start desc;
end;
$$;

revoke all on function public.admin_analytics_monthly_comparison(int) from public;
grant execute on function public.admin_analytics_monthly_comparison(int) to authenticated;
