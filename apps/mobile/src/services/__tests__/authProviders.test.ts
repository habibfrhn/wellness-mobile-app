import test from 'node:test';
import assert from 'node:assert/strict';

import { canManagePassword, getAuthProviderLabel, getUserAuthProviders, isUserVerified } from '../authProviders.ts';

test('provider list is normalized, deduplicated, and ordered', () => {
  const user = {
    identities: [{ provider: 'Google' }, { provider: 'email' }, { provider: 'google' }],
    app_metadata: { providers: ['Email', 'apple'], provider: 'google' },
  } as never;

  assert.deepEqual(getUserAuthProviders(user), ['email', 'google', 'apple']);
});

test('password management requires email provider', () => {
  const emailUser = { app_metadata: { provider: 'email' } } as never;
  const oauthOnlyUser = { app_metadata: { provider: 'google' } } as never;

  assert.equal(canManagePassword(emailUser), true);
  assert.equal(canManagePassword(oauthOnlyUser), false);
});

test('oauth users are considered verified without email_confirmed_at', () => {
  const oauthUser = { app_metadata: { provider: 'google' } } as never;
  const emailUserUnverified = { app_metadata: { provider: 'email' } } as never;

  assert.equal(isUserVerified(oauthUser), true);
  assert.equal(isUserVerified(emailUserUnverified), false);
});

test('provider labels map known providers', () => {
  assert.equal(getAuthProviderLabel('email'), 'Email + Password');
  assert.equal(getAuthProviderLabel('google'), 'Google');
  assert.equal(getAuthProviderLabel('apple'), 'apple');
});
