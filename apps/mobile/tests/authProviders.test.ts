import assert from 'node:assert/strict';
import test from 'node:test';
import type { User } from '@supabase/supabase-js';

import { canManagePassword, getAuthProviderLabel, getUserAuthProviders, isUserVerified } from '../src/services/authProviders.ts';

function asUser(partial: Partial<User>): User {
  return partial as User;
}

test('authProviders normalizes provider list and sorts priority', () => {
  const user = asUser({
    identities: [{ provider: 'Google' } as never, { provider: ' email ' } as never],
    app_metadata: { providers: ['github', 'google'], provider: 'email' },
  });

  assert.deepEqual(getUserAuthProviders(user), ['email', 'google', 'github']);
  assert.equal(canManagePassword(user), true);
});

test('authProviders labels providers and verifies oauth users', () => {
  assert.equal(getAuthProviderLabel('email'), 'Email + Password');
  assert.equal(getAuthProviderLabel('google'), 'Google');
  assert.equal(getAuthProviderLabel('github'), 'github');

  const oauthUser = asUser({ email_confirmed_at: undefined, phone_confirmed_at: undefined, app_metadata: { providers: ['google'] } });
  const emailUser = asUser({ email_confirmed_at: undefined, phone_confirmed_at: undefined, app_metadata: { providers: ['email'] } });
  assert.equal(isUserVerified(oauthUser), true);
  assert.equal(isUserVerified(emailUser), false);
});
