import { describe, expect, it, vi, beforeEach } from 'vitest';
import { id } from '../i18n/strings';

const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();
const mockGetUser = vi.fn();
const mockInvoke = vi.fn();
const mockSignOut = vi.fn();
const mockSetNextAuthRoute = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      refreshSession: mockRefreshSession,
      getUser: mockGetUser,
      signOut: mockSignOut,
      storageKey: 'sb-test-auth-token',
    },
    functions: { invoke: mockInvoke },
  },
}));
vi.mock('./authStart', () => ({ setNextAuthRoute: mockSetNextAuthRoute }));
vi.mock('./authStorage', () => ({ getRelatedAuthStorageKeys: () => ['sb-test-auth-token'], clearSupabaseNativeAuthArtifacts: vi.fn() }));

import { deleteCurrentAccount } from './deleteAccount';

describe('deleteCurrentAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', { localStorage: { removeItem: vi.fn() }, sessionStorage: { removeItem: vi.fn() } });
  });

  it('deletes account and signs user out', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'token-1' } }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    mockSignOut.mockResolvedValue({ error: null });

    await deleteCurrentAccount();

    expect(mockInvoke).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'global' });
    expect(mockSetNextAuthRoute).toHaveBeenCalledWith('Login');
  });

  it('maps unauthorized delete call to session-missing error', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'token-1' } }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockInvoke.mockResolvedValue({ data: { ok: false, code: 'MISSING_USER_TOKEN' }, error: { context: { status: 401 } } });

    await expect(deleteCurrentAccount()).rejects.toThrow(id.account.sessionMissing);
  });
});
