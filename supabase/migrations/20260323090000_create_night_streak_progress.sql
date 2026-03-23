create table if not exists public.night_streak_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_completed_date date,
  total_completed_sessions integer not null default 0 check (total_completed_sessions >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_night_streak_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_night_streak_progress_updated_at on public.night_streak_progress;

create trigger set_night_streak_progress_updated_at
before update on public.night_streak_progress
for each row
execute function public.set_night_streak_progress_updated_at();

alter table public.night_streak_progress enable row level security;

create policy "night_streak_progress_select_own"
on public.night_streak_progress for select
using (auth.uid() = user_id);

create policy "night_streak_progress_insert_own"
on public.night_streak_progress for insert
with check (auth.uid() = user_id);

create policy "night_streak_progress_update_own"
on public.night_streak_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.record_night_streak_completion(p_completion_date date)
returns public.night_streak_progress
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
  v_progress public.night_streak_progress%rowtype;
  v_day_gap integer;
  v_next_current integer;
  v_next_longest integer;
  v_next_total integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_progress
  from public.night_streak_progress
  where user_id = v_user_id
  for update;

  if not found then
    insert into public.night_streak_progress (
      user_id,
      current_streak,
      longest_streak,
      last_completed_date,
      total_completed_sessions
    ) values (
      v_user_id,
      1,
      1,
      p_completion_date,
      1
    )
    returning * into v_progress;

    return v_progress;
  end if;

  if v_progress.last_completed_date = p_completion_date then
    return v_progress;
  end if;

  v_day_gap := p_completion_date - v_progress.last_completed_date;

  if v_progress.last_completed_date is null then
    v_next_current := 1;
    v_next_total := v_progress.total_completed_sessions + 1;
  elsif v_day_gap = 1 then
    v_next_current := v_progress.current_streak + 1;
    v_next_total := v_progress.total_completed_sessions + 1;
  else
    v_next_current := 1;
    v_next_total := v_progress.total_completed_sessions + 1;
  end if;

  v_next_longest := greatest(v_progress.longest_streak, v_next_current);

  update public.night_streak_progress
  set
    current_streak = v_next_current,
    longest_streak = v_next_longest,
    last_completed_date = p_completion_date,
    total_completed_sessions = v_next_total
  where user_id = v_user_id
  returning * into v_progress;

  return v_progress;
end;
$$;

grant execute on function public.record_night_streak_completion(date) to authenticated;
