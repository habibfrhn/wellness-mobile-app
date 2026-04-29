import { describe, expect, it, vi } from 'vitest';

import { buildAuthRedirectPath, getWebAuthPath, getWebAppOrigin, isAllowedWebOrigin, replaceWebUrl } from './webAuth';

describe('web auth origin and redirect handling', () => {
  it('allows configured and localhost origins', () => {
    process.env.EXPO_PUBLIC_WEB_ALLOWED_ORIGINS = 'https://app.example.com';
    expect(isAllowedWebOrigin('https://app.example.com/')).toBe(true);
    expect(isAllowedWebOrigin('http://localhost:8081')).toBe(false);
    delete process.env.EXPO_PUBLIC_WEB_ALLOWED_ORIGINS;
    expect(isAllowedWebOrigin('http://localhost:8081')).toBe(true);
  });

  it('resolves callback/reset paths including expo web prefix', () => {
    expect(getWebAuthPath('/auth/callback')).toBe('callback');
    expect(getWebAuthPath('/--/auth/reset')).toBe('reset');
    expect(getWebAuthPath('/unknown')).toBeNull();
  });

  it('builds and applies web urls safely', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://lumepo.com' },
      history: { replaceState: vi.fn() },
    });

    expect(getWebAppOrigin()).toBe('https://lumepo.com');
    expect(buildAuthRedirectPath('callback')).toBe('https://lumepo.com/auth/callback');
    replaceWebUrl('/auth/reset');
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/auth/reset');
  });
});
