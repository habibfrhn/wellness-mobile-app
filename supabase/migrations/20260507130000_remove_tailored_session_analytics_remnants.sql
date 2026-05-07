-- Retire tailored sleep-session analytics at the database boundary.
--
-- Tailored sleep session is no longer a product surface. Current tracking keeps
-- individual audio usage in public.audio_play_sessions and allows only the
-- remaining non-tailored analytics_events names used by active app flows.

-- Historical tailored-session telemetry is no longer queried by the app,
-- dashboard, RPCs, or edge functions after the admin analytics cleanup.
delete from public.analytics_events
where event_name in (
  'tailored_session_select',
  'tailored_session_start',
  'tailored_session_complete',
  'tailored_session_dropoff'
);

create or replace function public.analytics_event_props_are_valid(p_event_name text, p_event_props jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  v_props jsonb := coalesce(p_event_props, '{}'::jsonb);
  v_key_count int := 0;
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

  return v_key_count = 0;
end;
$$;

alter table public.analytics_events
  drop constraint if exists analytics_events_event_props_shape_check;

alter table public.analytics_events
  add constraint analytics_events_event_props_shape_check
  check (public.analytics_event_props_are_valid(event_name, event_props)) not valid;

alter table public.analytics_events
  validate constraint analytics_events_event_props_shape_check;

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
      'audio_abandon'
    )
  ) not valid;

alter table public.analytics_events
  validate constraint analytics_events_event_name_check;

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
    'audio_abandon'
  )
  and public.analytics_event_props_are_valid(event_name, event_props)
  and char_length(session_id) between 8 and 128
  and (
    (auth.uid() is null and user_id is null)
    or (auth.uid() is not null and user_id = auth.uid())
  )
);
