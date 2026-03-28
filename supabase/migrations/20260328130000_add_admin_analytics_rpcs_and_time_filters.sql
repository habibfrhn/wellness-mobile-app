-- Admin analytics RPCs with consistent time filters and strict admin-only access.

create or replace function public.analytics_range_start(range_key text)
returns timestamptz
language sql
stable
as $$
  select case lower(coalesce(range_key, '30d'))
    when '7d' then now() - interval '7 days'
    when '30d' then now() - interval '30 days'
    when '90d' then now() - interval '90 days'
    when '12m' then now() - interval '12 months'
    when 'all' then null
    else now() - interval '30 days'
  end;
$$;

create or replace function public.admin_analytics_kpis(range_key text default '30d')
returns table(
  total_audio_plays int,
  tailored_completion_rate numeric,
  signup_conversion_rate numeric,
  audio_completes int,
  audio_abandons int
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
    select *
    from public.analytics_events
    where v_start is null or occurred_at >= v_start
  ),
  funnel as (
    select
      count(*) filter (where event_name = 'landing_page_view')::int as page_views,
      count(*) filter (where event_name = 'signup_complete')::int as signup_completes
    from filtered
  ),
  tailored as (
    select
      count(*) filter (where event_name = 'tailored_session_start')::int as starts,
      count(*) filter (where event_name = 'tailored_session_complete')::int as completes
    from filtered
  ),
  audio as (
    select
      count(*) filter (where event_name = 'audio_play')::int as plays,
      count(*) filter (where event_name = 'audio_complete')::int as completes
    from filtered
  )
  select
    a.plays as total_audio_plays,
    case when t.starts = 0 then 0::numeric else round(t.completes::numeric / nullif(t.starts, 0), 4) end as tailored_completion_rate,
    case when f.page_views = 0 then 0::numeric else round(f.signup_completes::numeric / nullif(f.page_views, 0), 4) end as signup_conversion_rate,
    a.completes as audio_completes,
    greatest(a.plays - a.completes, 0) as audio_abandons
  from funnel f, tailored t, audio a;
end;
$$;

create or replace function public.admin_analytics_funnel(range_key text default '30d')
returns table(
  page_view_sessions int,
  cta_sessions int,
  signup_start_sessions int,
  signup_complete_sessions int
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
  with base as (
    select session_id, event_name
    from public.analytics_events
    where event_name in ('landing_page_view', 'landing_cta_click', 'signup_start', 'signup_complete')
      and (v_start is null or occurred_at >= v_start)
  ),
  by_session as (
    select
      session_id,
      bool_or(event_name = 'landing_page_view') as has_view,
      bool_or(event_name = 'landing_cta_click') as has_cta,
      bool_or(event_name = 'signup_start') as has_signup_start,
      bool_or(event_name = 'signup_complete') as has_signup_complete
    from base
    group by session_id
  )
  select
    count(*) filter (where has_view)::int as page_view_sessions,
    count(*) filter (where has_view and has_cta)::int as cta_sessions,
    count(*) filter (where has_view and has_cta and has_signup_start)::int as signup_start_sessions,
    count(*) filter (where has_view and has_cta and has_signup_start and has_signup_complete)::int as signup_complete_sessions
  from by_session;
end;
$$;

create or replace function public.admin_analytics_audio_summary(range_key text default '30d')
returns table(
  audio_id text,
  plays int,
  completes int,
  abandons int,
  derived_abandons int,
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
      event_props->>'audio_id' as grouped_audio_id,
      count(*) filter (where event_name = 'audio_play')::int as grouped_plays,
      count(*) filter (where event_name = 'audio_complete')::int as grouped_completes,
      count(*) filter (where event_name = 'audio_abandon')::int as grouped_abandons
    from public.analytics_events
    where event_name in ('audio_play', 'audio_complete', 'audio_abandon')
      and coalesce(event_props->>'audio_id', '') <> ''
      and (v_start is null or occurred_at >= v_start)
    group by event_props->>'audio_id'
  )
  select
    grouped_audio_id as audio_id,
    grouped_plays as plays,
    grouped_completes as completes,
    grouped_abandons as abandons,
    greatest(grouped_plays - grouped_completes, 0) as derived_abandons,
    case when grouped_plays = 0 then 0::numeric else round(grouped_completes::numeric / nullif(grouped_plays, 0), 4) end as completion_rate,
    case when grouped_plays = 0 then 0::numeric else round(greatest(grouped_plays - grouped_completes, 0)::numeric / nullif(grouped_plays, 0), 4) end as abandon_rate
  from grouped
  order by grouped_plays desc, grouped_audio_id asc;
end;
$$;

create or replace function public.admin_analytics_monthly_12m()
returns table(
  month_start date,
  audio_plays int,
  signup_completes int,
  tailored_completes int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin access required';
  end if;

  return query
  with months as (
    select generate_series(
      date_trunc('month', now() - interval '11 months')::date,
      date_trunc('month', now())::date,
      interval '1 month'
    )::date as month_start
  ),
  grouped as (
    select
      date_trunc('month', occurred_at)::date as month_start,
      count(*) filter (where event_name = 'audio_play')::int as audio_plays,
      count(*) filter (where event_name = 'signup_complete')::int as signup_completes,
      count(*) filter (where event_name = 'tailored_session_complete')::int as tailored_completes
    from public.analytics_events
    where occurred_at >= date_trunc('month', now() - interval '11 months')
    group by 1
  )
  select
    m.month_start,
    coalesce(g.audio_plays, 0) as audio_plays,
    coalesce(g.signup_completes, 0) as signup_completes,
    coalesce(g.tailored_completes, 0) as tailored_completes
  from months m
  left join grouped g on g.month_start = m.month_start
  order by m.month_start asc;
end;
$$;

revoke all on function public.admin_analytics_kpis(text) from public;
revoke all on function public.admin_analytics_funnel(text) from public;
revoke all on function public.admin_analytics_audio_summary(text) from public;
revoke all on function public.admin_analytics_monthly_12m() from public;

grant execute on function public.admin_analytics_kpis(text) to authenticated;
grant execute on function public.admin_analytics_funnel(text) to authenticated;
grant execute on function public.admin_analytics_audio_summary(text) to authenticated;
grant execute on function public.admin_analytics_monthly_12m() to authenticated;

-- Tighten direct view reads; use admin RPCs as the canonical access path.
revoke select on public.analytics_audio_summary from authenticated;
revoke select on public.analytics_tailored_summary from authenticated;
revoke select on public.analytics_funnel_summary from authenticated;
