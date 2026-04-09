create or replace function public.admin_analytics_product_actions(range_key text default '30d')
returns table(
  home_sleep_clicks int,
  tailored_session_selections int,
  tailored_session_starts int,
  signup_completes int
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
    count(*) filter (where event_name = 'tailored_session_start')::int as tailored_session_starts,
    count(*) filter (where event_name = 'signup_complete')::int as signup_completes
  from public.analytics_events
  where event_name in ('home_sleep_cta_click', 'tailored_session_select', 'tailored_session_start', 'signup_complete')
    and (v_start is null or occurred_at >= v_start);
end;
$$;

revoke all on function public.admin_analytics_product_actions(text) from public;
grant execute on function public.admin_analytics_product_actions(text) to authenticated;
