import test from 'node:test';
import assert from 'node:assert/strict';

import { isValidTrackPayload, sanitizeEventProps } from '../analyticsSchema.ts';

test('audio events require valid audio_id and are normalized', () => {
  assert.deepEqual(sanitizeEventProps('audio_play', { audio_id: '  Track_01 ' }), { audio_id: 'track_01' });
  assert.equal(sanitizeEventProps('audio_play', { audio_id: '' }), null);
});

test('tailored session events require supported session_mode', () => {
  assert.deepEqual(sanitizeEventProps('tailored_session_start', { session_mode: 'calm_mind' }), {
    session_mode: 'calm_mind',
  });
  assert.equal(sanitizeEventProps('tailored_session_start', { session_mode: 'unsupported' }), null);
});

test('payload validator enforces event specific props', () => {
  assert.equal(
    isValidTrackPayload({ event_name: 'landing_page_view', event_props: {}, session_id: 'session_123456' }),
    true
  );

  assert.equal(
    isValidTrackPayload({ event_name: 'audio_play', event_props: {}, session_id: 'session_123456' }),
    false
  );
});
