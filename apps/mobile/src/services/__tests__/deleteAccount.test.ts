import { deleteCurrentAccount } from '../deleteAccount';

const mocks = {
  getSession: jest.fn(),
  refreshSession: jest.fn(),
  getUser: jest.fn(),
  signOut: jest.fn(),
  invoke: jest.fn(),
  setNextAuthRoute: jest.fn(),
};

jest.mock('../authStart', () => ({ setNextAuthRoute: (...args: unknown[]) => mocks.setNextAuthRoute(...args) }));
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      storageKey: 'sb-test-auth-token',
      getSession: (...args: unknown[]) => mocks.getSession(...args),
      refreshSession: (...args: unknown[]) => mocks.refreshSession(...args),
      getUser: (...args: unknown[]) => mocks.getUser(...args),
      signOut: (...args: unknown[]) => mocks.signOut(...args),
    },
    functions: { invoke: (...args: unknown[]) => mocks.invoke(...args) },
  },
}));

describe('deleteCurrentAccount', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((fn) => fn.mockReset());
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'token-a' } }, error: null });
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.setNextAuthRoute.mockResolvedValue(undefined);
  });

  it('deletes account and globally signs user out on success', async () => {
    await expect(deleteCurrentAccount()).resolves.toBeUndefined();
    expect(mocks.invoke).toHaveBeenCalled();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  it('refreshes auth once when session is stale before deletion', async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('invalid token') });
    mocks.refreshSession.mockResolvedValue({ data: { session: { access_token: 'token-b' } }, error: null });

    await expect(deleteCurrentAccount()).resolves.toBeUndefined();
    expect(mocks.refreshSession).toHaveBeenCalled();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  it('fails with user-safe error on backend auth failure', async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: false, code: 'INVALID_SESSION' }, error: null });
    await expect(deleteCurrentAccount()).rejects.toThrow('Your session expired. Please log in again.');
  });
});
