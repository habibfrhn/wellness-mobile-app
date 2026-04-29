import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSignInWithOAuth = vi.fn();
const mockSetNextAuthRoute = vi.fn();
const mockOpenUrl = vi.fn();

vi.mock('./supabase', () => ({
  AUTH_CALLBACK: 'https://lumepo.com/auth/callback',
  hasValidAuthRedirects: true,
  supabase: { auth: { signInWithOAuth: mockSignInWithOAuth } },
}));
vi.mock('./authStart', () => ({ setNextAuthRoute: mockSetNextAuthRoute }));
vi.mock('./authDebug', () => ({ logAuthDebugEvent: vi.fn() }));
vi.mock('expo-linking', () => ({ default: { openURL: mockOpenUrl }, openURL: mockOpenUrl }));

import { continueWithGoogle } from './authOAuth';

describe('continueWithGoogle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts oauth flow with expected payload', async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'https://oauth' }, error: null });

    const result = await continueWithGoogle({ nextRoute: 'SignUp' });

    expect(result.status).toBe('started');
    expect(mockSetNextAuthRoute).toHaveBeenCalledWith('SignUp');
    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    );
  });

  it('surfaces oauth provider failures', async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: null, error: new Error('oauth failed') });

    await expect(continueWithGoogle()).rejects.toThrow('oauth failed');
  });
});
