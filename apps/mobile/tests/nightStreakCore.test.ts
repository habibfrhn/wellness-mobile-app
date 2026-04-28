import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveNightStreakHeroStateAt, getNightDateKeyAt } from '../src/services/nightStreakCore.ts';

test('nightStreakCore creates date keys', () => {
  assert.equal(getNightDateKeyAt(new Date('2026-04-28T10:00:00.000Z')), '2026-04-28');
});

test('nightStreakCore derives no_streak, active, and broken states', () => {
  assert.deepEqual(deriveNightStreakHeroStateAt(null), { kind: 'no_streak' });

  const progress = {
    userId: 'u1',
    currentStreak: 3,
    longestStreak: 5,
    lastCompletedDate: '2026-04-27',
    totalCompletedSessions: 7,
    createdAt: '',
    updatedAt: '',
  };

  assert.deepEqual(deriveNightStreakHeroStateAt(progress, new Date('2026-04-28T08:00:00.000Z')), {
    kind: 'active',
    count: 3,
  });
  assert.deepEqual(deriveNightStreakHeroStateAt(progress, new Date('2026-04-30T08:00:00.000Z')), {
    kind: 'broken',
  });
});
