import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();
const mockSetNextAuthRoute = vi.fn();
const mockClearNative = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      refreshSession: mockRefreshSession,
      signOut: mockSignOut,
      storageKey: 'sb-test-auth-token',
    },
  },
}));

vi.mock('./authStart', () => ({ setNextAuthRoute: mockSetNextAuthRoute }));
vi.mock('./authStorage', () => ({
  getRelatedAuthStorageKeys: () => ['sb-test-auth-token'],
  clearSupabaseNativeAuthArtifacts: mockClearNative,
}));
vi.mock('./logoutDebug', () => ({ logLogoutEvent: vi.fn() }));

import { restoreSession, signOutToLogin } from './authSession';

describe('authSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', {
      localStorage: {
        length: 1,
        key: () => 'sb-test-auth-token',
        removeItem: vi.fn(),
      },
      sessionStorage: { removeItem: vi.fn() },
      location: { hostname: 'localhost' },
    });
    vi.stubGlobal('document', { cookie: 'sb=test' });
  });

  it('refreshes nearly expired sessions', async () => {
    const now = Math.floor(Date.now() / 1000);
    mockGetSession.mockResolvedValueOnce({ data: { session: { expires_at: now + 30, user: { id: 'u1' } } }, error: null });
    mockRefreshSession.mockResolvedValueOnce({
      data: { session: { expires_at: now + 3600, user: { id: 'u1' } } },
      error: null,
    });

    const result = await restoreSession();

    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(result.recovered).toBe(true);
    expect(result.session?.user.id).toBe('u1');
  });

  it('clears session artifacts on refresh failure', async () => {
    const now = Math.floor(Date.now() / 1000);
    mockGetSession.mockResolvedValueOnce({ data: { session: { expires_at: now + 30, user: { id: 'u1' } } }, error: null });
    mockRefreshSession.mockResolvedValueOnce({ data: { session: null }, error: { message: 'invalid refresh token' } });
    mockSignOut.mockResolvedValue({ error: null });

    const result = await restoreSession();

    expect(result.session).toBeNull();
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('retries global sign out after token errors', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSignOut
      .mockResolvedValueOnce({ error: { message: 'jwt expired' } })
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });
    mockRefreshSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });

    const result = await signOutToLogin('global', { source: 'profile_screen' });

    expect(mockRefreshSession).toHaveBeenCalled();
    expect(result.error).toBeNull();
    expect(mockSetNextAuthRoute).toHaveBeenCalledWith('Login');
  });
});
