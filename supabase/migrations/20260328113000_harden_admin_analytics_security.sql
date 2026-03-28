-- Harden analytics/admin access controls for MVP production safety.

-- 1) Prevent authenticated clients from self-promoting to admin.
revoke insert, delete on public.admin_users from authenticated;
grant select on public.admin_users to authenticated;

-- 2) Restrict accepted analytics event names and session id shape.
alter table public.analytics_events
  drop constraint if exists analytics_events_event_name_check;

alter table public.analytics_events
  add constraint analytics_events_event_name_check
  check (
    event_name in (
      'landing_page_view',
      'landing_cta_click',
      'signup_start',
      'signup_complete',
      'audio_play',
      'audio_complete',
      'audio_abandon',
      'tailored_session_start',
      'tailored_session_complete',
      'tailored_session_dropoff'
    )
  ) not valid;

alter table public.analytics_events
  validate constraint analytics_events_event_name_check;

alter table public.analytics_events
  drop constraint if exists analytics_events_session_id_length_check;

alter table public.analytics_events
  add constraint analytics_events_session_id_length_check
  check (char_length(session_id) between 8 and 128) not valid;

alter table public.analytics_events
  validate constraint analytics_events_session_id_length_check;

-- 3) Force user_id to follow auth context (no spoofing from anon/authenticated clients).
create or replace function public.set_analytics_event_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

-- 4) Harden insert policy checks (while still allowing anon/authenticated inserts).
drop policy if exists "analytics_events_insert_public" on public.analytics_events;
create policy "analytics_events_insert_public"
on public.analytics_events for insert
to anon, authenticated
with check (
  event_name in (
    'landing_page_view',
    'landing_cta_click',
    'signup_start',
    'signup_complete',
    'audio_play',
    'audio_complete',
    'audio_abandon',
    'tailored_session_start',
    'tailored_session_complete',
    'tailored_session_dropoff'
  )
  and jsonb_typeof(event_props) = 'object'
  and char_length(session_id) between 8 and 128
  and (
    (auth.uid() is null and user_id is null)
    or (auth.uid() is not null and user_id = auth.uid())
  )
);
