with distinct_session_dates as (
  select
    ns.user_id,
    ns.date_key::date as completion_date
  from public.night_sessions ns
  group by ns.user_id, ns.date_key::date
),
numbered as (
  select
    d.user_id,
    d.completion_date,
    row_number() over (partition by d.user_id order by d.completion_date) as rn
  from distinct_session_dates d
),
segmented as (
  select
    n.user_id,
    n.completion_date,
    (n.completion_date - (n.rn::int * interval '1 day'))::date as streak_group
  from numbered n
),
streak_groups as (
  select
    s.user_id,
    s.streak_group,
    count(*)::int as streak_len,
    max(s.completion_date) as streak_end_date
  from segmented s
  group by s.user_id, s.streak_group
),
summary as (
  select
    d.user_id,
    count(*)::int as total_completed_sessions,
    max(d.completion_date) as last_completed_date
  from distinct_session_dates d
  group by d.user_id
),
computed as (
  select
    sm.user_id,
    current_group.streak_len as current_streak,
    longest_group.longest_streak,
    sm.last_completed_date,
    sm.total_completed_sessions
  from summary sm
  join lateral (
    select sg.streak_len
    from streak_groups sg
    where sg.user_id = sm.user_id
      and sg.streak_end_date = sm.last_completed_date
    order by sg.streak_len desc
    limit 1
  ) as current_group on true
  join lateral (
    select max(sg.streak_len)::int as longest_streak
    from streak_groups sg
    where sg.user_id = sm.user_id
  ) as longest_group on true
)
insert into public.night_streak_progress (
  user_id,
  current_streak,
  longest_streak,
  last_completed_date,
  total_completed_sessions
)
select
  c.user_id,
  c.current_streak,
  c.longest_streak,
  c.last_completed_date,
  c.total_completed_sessions
from computed c
on conflict (user_id) do update
set
  current_streak = excluded.current_streak,
  longest_streak = excluded.longest_streak,
  last_completed_date = excluded.last_completed_date,
  total_completed_sessions = excluded.total_completed_sessions,
  updated_at = timezone('utc', now())
where public.night_streak_progress.total_completed_sessions = 0;
