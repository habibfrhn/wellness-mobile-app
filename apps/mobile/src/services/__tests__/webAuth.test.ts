import { Platform } from 'react-native';
import { buildAuthRedirectPath, getWebAuthPath, isAllowedWebOrigin } from '../webAuth';

describe('webAuth', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('allows safe origins and blocks unknown origins', () => {
    expect(isAllowedWebOrigin('https://lumepo.com')).toBe(true);
    expect(isAllowedWebOrigin('http://localhost:8081')).toBe(true);
    expect(isAllowedWebOrigin('https://evil.example.com')).toBe(false);
  });

  it('builds web and native auth redirect paths', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('web');
    expect(buildAuthRedirectPath('callback')).toContain('/auth/callback');

    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');
    expect(buildAuthRedirectPath('reset')).toBe('wellnessapp://auth/reset');
  });

  it('parses callback and reset auth routes with expo prefix', () => {
    expect(getWebAuthPath('/auth/callback')).toBe('callback');
    expect(getWebAuthPath('/--/auth/reset/')).toBe('reset');
    expect(getWebAuthPath('/other')).toBeNull();
  });
});
