import test from 'node:test';
import assert from 'node:assert/strict';

import { getAllowedCorsOrigin, isValidPayload, parsePayloadEvents } from '../validation.ts';

test('cors origin allowlist accepts required origins and preview hosts', () => {
  assert.equal(getAllowedCorsOrigin('https://lumepo.com', ''), 'https://lumepo.com');
  assert.equal(
    getAllowedCorsOrigin('https://wellness-mobile-123abc.vercel.app', ''),
    'https://wellness-mobile-123abc.vercel.app'
  );
  assert.equal(getAllowedCorsOrigin('https://evil.example.com', ''), null);
});

test('single payload validation enforces schema', () => {
  assert.equal(
    isValidPayload({ event_name: 'audio_play', event_props: { audio_id: 'track_01' }, session_id: 'session_123456' }),
    true
  );

  assert.equal(
    isValidPayload({ event_name: 'audio_play', event_props: {}, session_id: 'session_123456' }),
    false
  );
});

test('batch payload parsing validates max limits and item validity', () => {
  const validBatch = {
    events: [
      { event_name: 'landing_page_view', event_props: {}, session_id: 'session_123456' },
      { event_name: 'audio_click', event_props: { audio_id: 'track_01' }, session_id: 'session_123456' },
    ],
  };

  assert.equal(parsePayloadEvents(validBatch, 25)?.length, 2);
  assert.equal(parsePayloadEvents({ events: [] }, 25), null);
  assert.equal(parsePayloadEvents(validBatch, 1), null);
});
