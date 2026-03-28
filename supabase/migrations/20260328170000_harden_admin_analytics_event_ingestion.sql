-- Further hardening for analytics ingestion used by admin dashboards.
-- Goals:
-- - Prevent timestamp spoofing for dashboard metrics.
-- - Restrict event_props to a minimal, expected schema per event type.
-- - Reduce payload abuse/poisoning risk from anon/authenticated inserts.

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

  if p_event_name in ('audio_play', 'audio_complete', 'audio_abandon') then
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

-- Normalize legacy rows so the new constraint can be validated safely.
update public.analytics_events
set event_props = case
  when event_name in ('audio_play', 'audio_complete', 'audio_abandon') then jsonb_build_object(
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
  else '{}'::jsonb
end
where not public.analytics_event_props_are_valid(event_name, event_props);

alter table public.analytics_events
  validate constraint analytics_events_event_props_shape_check;

create or replace function public.set_analytics_event_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  new.occurred_at := now();
  return new;
end;
$$;

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
  and public.analytics_event_props_are_valid(event_name, event_props)
  and char_length(session_id) between 8 and 128
  and (
    (auth.uid() is null and user_id is null)
    or (auth.uid() is not null and user_id = auth.uid())
  )
);
