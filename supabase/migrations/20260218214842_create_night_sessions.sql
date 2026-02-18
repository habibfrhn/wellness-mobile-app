create table if not exists public.night_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date_key text not null,
  mode text not null check (mode in ('calm_mind', 'release_accept')),
  stress_before smallint not null check (stress_before between 1 and 5),
  stress_after smallint not null check (stress_after between 1 and 5),
  completed_at timestamptz not null default now(),
  constraint night_sessions_user_date_unique unique (user_id, date_key)
);

create index if not exists night_sessions_user_id_idx
  on public.night_sessions (user_id);

create index if not exists night_sessions_completed_at_idx
  on public.night_sessions (completed_at desc);

alter table public.night_sessions enable row level security;

create policy "night_sessions_select_own"
on public.night_sessions for select
using (auth.uid() = user_id);

create policy "night_sessions_insert_own"
on public.night_sessions for insert
with check (auth.uid() = user_id);

create policy "night_sessions_update_own"
on public.night_sessions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "night_sessions_delete_own"
on public.night_sessions for delete
using (auth.uid() = user_id);
