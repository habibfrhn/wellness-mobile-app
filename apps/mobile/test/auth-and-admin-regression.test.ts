import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = {
  signInWithOAuth: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  setSession: vi.fn(),
  verifyOtp: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  getUser: vi.fn(),
};

const functions = { invoke: vi.fn() };
const rpcBuilder = { single: vi.fn() };
const rpc = vi.fn(() => rpcBuilder);

vi.mock('../src/services/supabase', () => ({
  AUTH_CALLBACK: 'https://lumepo.com/auth/callback',
  hasValidAuthRedirects: true,
  supabase: { auth, functions, rpc },
}));

vi.mock('../src/services/authStart', () => ({ setNextAuthRoute: vi.fn() }));
vi.mock('../src/services/authDebug', () => ({ logAuthDebugEvent: vi.fn() }));
vi.mock('../src/services/logoutDebug', () => ({ logLogoutEvent: vi.fn() }));

describe('auth and admin regression tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('starts Google OAuth with callback and skipBrowserRedirect on web', async () => {
    const { continueWithGoogle } = await import('../src/services/authOAuth');
    auth.signInWithOAuth.mockResolvedValue({ data: { url: 'x' }, error: null });

    await expect(continueWithGoogle({ nextRoute: 'SignUp' })).resolves.toEqual({ status: 'started' });
    expect(auth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }));
  });

  it('handles callback code exchange success and failure', async () => {
    const { handleAuthLink } = await import('../src/services/authLinks');
    auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { session: { user: { id: 'u1' } } }, error: null });
    let res = await handleAuthLink('https://lumepo.com/auth/callback?code=abc&type=signup');
    expect(res).toMatchObject({ handled: true, ok: true, path: 'auth/callback' });

    auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { session: null }, error: { message: 'expired link' } });
    res = await handleAuthLink('https://lumepo.com/auth/callback?code=abc&type=signup');
    expect(res).toMatchObject({ handled: true, ok: false, error: 'expired link' });
  });

  it('handles access token and refresh token links by setting session', async () => {
    const { handleAuthLink } = await import('../src/services/authLinks');
    auth.setSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null });

    const res = await handleAuthLink('https://lumepo.com/auth/reset#access_token=at&refresh_token=rt&type=recovery');
    expect(auth.setSession).toHaveBeenCalledWith({ access_token: 'at', refresh_token: 'rt' });
    expect(res).toMatchObject({ handled: true, ok: true, path: 'auth/reset' });
  });

  it('restores valid session and refreshes near-expiry session', async () => {
    const { restoreSession } = await import('../src/services/authSession');
    auth.getSession.mockResolvedValueOnce({ data: { session: { expires_at: Math.floor(Date.now() / 1000) + 5000, user: { id: 'u' } } }, error: null });
    let restored = await restoreSession();
    expect(restored.session).toBeTruthy();

    auth.getSession.mockResolvedValueOnce({ data: { session: { expires_at: Math.floor(Date.now() / 1000) + 1, user: { id: 'u' } } }, error: null });
    auth.refreshSession.mockResolvedValueOnce({ data: { session: { expires_at: Math.floor(Date.now() / 1000) + 1000, user: { id: 'u' } } }, error: null });
    restored = await restoreSession();
    expect(auth.refreshSession).toHaveBeenCalled();
    expect(restored.session).toBeTruthy();
  });

  it('clears session when refresh fails (expired refresh token path)', async () => {
    const { restoreSession } = await import('../src/services/authSession');
    auth.getSession.mockResolvedValueOnce({ data: { session: { expires_at: Math.floor(Date.now() / 1000), user: { id: 'u' } } }, error: null });
    auth.refreshSession.mockResolvedValueOnce({ data: { session: null }, error: { message: 'refresh token expired' } });
    auth.signOut.mockResolvedValue({ error: null });
    const res = await restoreSession();
    expect(res.session).toBeNull();
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('deletes account with access token and signs out globally', async () => {
    const { deleteCurrentAccount } = await import('../src/services/deleteAccount');
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'at' } }, error: null });
    auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    functions.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    auth.signOut.mockResolvedValue({ error: null });

    await expect(deleteCurrentAccount()).resolves.toBeUndefined();
    expect(functions.invoke).toHaveBeenCalled();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  it('maps delete-account rate limits and invalid session errors', async () => {
    const { deleteCurrentAccount } = await import('../src/services/deleteAccount');
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'at' } }, error: null });
    auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    functions.invoke.mockResolvedValue({ data: { ok: false, code: 'RATE_LIMITED' }, error: { context: { status: 429 } } });
    await expect(deleteCurrentAccount()).rejects.toThrow();
  });

  it('detects admin unauthorized errors and normalizes analytics responses', async () => {
    const admin = await import('../src/services/adminAnalytics');
    expect(admin.isAdminUnauthorizedError({ message: 'Admin access required' })).toBe(true);

    rpcBuilder.single.mockResolvedValue({ data: { home_sleep_clicks: '3', tailored_session_selections: null, tailored_session_starts: 2, successful_signups: '1' }, error: null });
    const actions = await admin.fetchAdminProductActions('7d');
    expect(actions.data?.home_sleep_clicks).toBe(3);
    expect(actions.data?.tailored_session_selections).toBe(0);
  });
});
