import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isAdminUnauthorizedErrorCore,
  normalizeAudioRows,
  normalizeProductActions,
  normalizeTailoredRows,
} from '../src/services/adminAnalyticsCore.ts';

test('adminAnalyticsCore detects unauthorized errors', () => {
  assert.equal(isAdminUnauthorizedErrorCore({ message: 'admin access required' }), true);
  assert.equal(isAdminUnauthorizedErrorCore({ code: '42501' }), true);
  assert.equal(isAdminUnauthorizedErrorCore({ message: 'other error' }), false);
});

test('adminAnalyticsCore normalizes product and audio rows', () => {
  assert.deepEqual(
    normalizeProductActions({
      home_sleep_clicks: '4' as unknown as number,
      tailored_session_selections: null as unknown as number,
      tailored_session_starts: 2,
      successful_signups: '3' as unknown as number,
    }),
    {
      home_sleep_clicks: 4,
      tailored_session_selections: 0,
      tailored_session_starts: 2,
      successful_signups: 3,
    },
  );

  assert.deepEqual(
    normalizeAudioRows([
      { audio_id: '', clicks: '5' as unknown as number, starts: 2, completes: null as unknown as number, abandons: 1, completion_rate: '50' as unknown as number },
    ]),
    [{ audio_id: 'unknown_audio', clicks: 5, starts: 2, completes: 0, abandons: 1, completion_rate: 50 }],
  );
});

test('adminAnalyticsCore filters tailored session modes', () => {
  const rows = normalizeTailoredRows([
    { session_mode: 'calm_mind', selections: 1, starts: 1, completes: 1, dropoffs: 0, completion_rate: 100 },
    { session_mode: 'release_accept', selections: 1, starts: 1, completes: 1, dropoffs: 0, completion_rate: 100 },
    { session_mode: 'invalid' as 'calm_mind', selections: 1, starts: 1, completes: 0, dropoffs: 1, completion_rate: 0 },
  ]);

  assert.equal(rows.length, 2);
});
