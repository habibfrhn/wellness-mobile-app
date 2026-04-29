import test from 'node:test';
import assert from 'node:assert/strict';
import { getUserAuthProviders, canManagePassword, isUserVerified, getAuthProviderLabel } from '../src/services/authProviders.ts';

const user = (overrides = {}) => ({ identities: [], app_metadata: {}, ...overrides });

test('email/password + oauth provider extraction is deterministic for account-linking cases', () => {
  const providers = getUserAuthProviders(
    user({
      identities: [{ provider: 'google' }, { provider: 'email' }, { provider: 'Google' }],
      app_metadata: { provider: 'email', providers: ['google', 'email'] },
    }),
  );
  assert.deepEqual(providers, ['email', 'google']);
});

test('linked account keeps password management available', () => {
  const linkedUser = user({ app_metadata: { providers: ['email', 'google'] } });
  assert.equal(canManagePassword(linkedUser), true);
  assert.equal(isUserVerified(linkedUser), true);
});

test('google-only users are treated as verified and cannot manage password', () => {
  const oauthUser = user({ app_metadata: { providers: ['google'] } });
  assert.equal(isUserVerified(oauthUser), true);
  assert.equal(canManagePassword(oauthUser), false);
});

test('provider labels are user-friendly and stable', () => {
  assert.equal(getAuthProviderLabel('email'), 'Email + Password');
  assert.equal(getAuthProviderLabel('google'), 'Google');
  assert.equal(getAuthProviderLabel('github'), 'github');
});
