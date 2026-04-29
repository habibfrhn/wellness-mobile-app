import { describe, expect, it } from 'vitest';

import { canManagePassword, getAuthProviderLabel, getUserAuthProviders, isUserVerified } from './authProviders';

describe('auth provider helpers', () => {
  it('deduplicates/sorts providers and prioritizes email/google', () => {
    const user = {
      identities: [{ provider: 'Google' }, { provider: 'email' }, { provider: 'google' }],
      app_metadata: { providers: ['github', 'email'], provider: 'google' },
    } as never;

    expect(getUserAuthProviders(user)).toEqual(['email', 'google', 'github']);
  });

  it('identifies password-management eligibility and verification', () => {
    const emailUser = { email_confirmed_at: null, app_metadata: { provider: 'email' } } as never;
    const oauthUser = { email_confirmed_at: null, app_metadata: { provider: 'google' } } as never;

    expect(canManagePassword(emailUser)).toBe(true);
    expect(isUserVerified(emailUser)).toBe(false);
    expect(isUserVerified(oauthUser)).toBe(true);
  });

  it('maps provider labels', () => {
    expect(getAuthProviderLabel('email')).toBe('Email + Password');
    expect(getAuthProviderLabel('google')).toBe('Google');
    expect(getAuthProviderLabel('github')).toBe('github');
  });
});
