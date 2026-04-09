create or replace function public.analytics_event_props_are_valid(p_event_name text, p_event_props jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  v_props jsonb := coalesce(p_event_props, '{}'::jsonb);
  v_key_count int := 0;
  v_session_mode text := trim(coalesce(v_props->>'session_mode', ''));
  v_surface text := trim(coalesce(v_props->>'surface', ''));
  v_cta text := trim(coalesce(v_props->>'cta', ''));
  v_method text := trim(coalesce(v_props->>'method', ''));
begin
  if jsonb_typeof(v_props) <> 'object' then
    return false;
  end if;

  select count(*) into v_key_count
  from jsonb_object_keys(v_props);

  if p_event_name = 'landing_page_view' then
    return (
      v_key_count = 0
      or (
        v_key_count = 1
        and coalesce(v_props ? 'surface', false)
        and jsonb_typeof(v_props->'surface') = 'string'
        and char_length(v_surface) between 1 and 64
      )
    );
  end if;

  if p_event_name = 'landing_cta_click' then
    return (
      v_key_count = 0
      or (
        v_key_count = 1
        and coalesce(v_props ? 'cta', false)
        and jsonb_typeof(v_props->'cta') = 'string'
        and char_length(v_cta) between 1 and 64
      )
    );
  end if;

  if p_event_name in ('signup_start', 'signup_complete') then
    return (
      v_key_count = 0
      or (
        v_key_count = 1
        and coalesce(v_props ? 'method', false)
        and jsonb_typeof(v_props->'method') = 'string'
        and char_length(v_method) between 1 and 64
      )
    );
  end if;

  if p_event_name in ('audio_click', 'audio_play', 'audio_complete', 'audio_abandon') then
    return (
      v_key_count = 1
      and coalesce(v_props ? 'audio_id', false)
      and jsonb_typeof(v_props->'audio_id') = 'string'
      and char_length(trim(v_props->>'audio_id')) between 1 and 120
      and trim(v_props->>'audio_id') ~ '^[A-Za-z0-9_-]+$'
    );
  end if;

  if p_event_name in ('tailored_session_select', 'tailored_session_start', 'tailored_session_complete', 'tailored_session_dropoff') then
    return (
      v_key_count = 1
      and coalesce(v_props ? 'session_mode', false)
      and jsonb_typeof(v_props->'session_mode') = 'string'
      and v_session_mode in ('calm_mind', 'release_accept')
    );
  end if;

  return v_key_count = 0;
end;
$$;

-- Normalize legacy rows to the expanded schema contract.
update public.analytics_events
set event_props = case
  when event_name = 'landing_page_view' then
    case
      when trim(coalesce(event_props->>'surface', '')) <> '' then jsonb_build_object('surface', lower(trim(event_props->>'surface')))
      else '{}'::jsonb
    end
  when event_name = 'landing_cta_click' then
    case
      when trim(coalesce(event_props->>'cta', '')) <> '' then jsonb_build_object('cta', lower(trim(event_props->>'cta')))
      else '{}'::jsonb
    end
  when event_name in ('signup_start', 'signup_complete') then
    case
      when trim(coalesce(event_props->>'method', '')) <> '' then jsonb_build_object('method', lower(trim(event_props->>'method')))
      else '{}'::jsonb
    end
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
      else jsonb_build_object('session_mode', 'calm_mind')
    end
  else '{}'::jsonb
end
where not public.analytics_event_props_are_valid(event_name, event_props);

alter table public.analytics_events
  drop constraint if exists analytics_events_event_props_shape_check;

alter table public.analytics_events
  add constraint analytics_events_event_props_shape_check
  check (public.analytics_event_props_are_valid(event_name, event_props)) not valid;

alter table public.analytics_events
  validate constraint analytics_events_event_props_shape_check;
