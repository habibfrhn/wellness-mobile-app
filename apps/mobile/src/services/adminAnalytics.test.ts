import { describe, expect, it, vi } from 'vitest';

const mockRpc = vi.fn();
vi.mock('./supabase', () => ({
  supabase: {
    rpc: mockRpc,
  },
}));

import {
  fetchAdminAudioEngagement,
  fetchAdminProductActions,
  fetchAdminTailoredSessions,
  isAdminUnauthorizedError,
} from './adminAnalytics';

describe('admin analytics authorization and normalization', () => {
  it('detects unauthorized admin errors', () => {
    expect(isAdminUnauthorizedError({ message: 'Admin access required' })).toBe(true);
    expect(isAdminUnauthorizedError({ code: '42501' })).toBe(true);
    expect(isAdminUnauthorizedError({ message: 'network timeout' })).toBe(false);
  });

  it('normalizes malformed product action payloads', async () => {
    mockRpc.mockReturnValueOnce({
      single: () => Promise.resolve({ data: { home_sleep_clicks: '4', successful_signups: null }, error: null }),
    });

    const result = await fetchAdminProductActions('7d');
    expect(result.data).toEqual({
      home_sleep_clicks: 4,
      tailored_session_selections: 0,
      tailored_session_starts: 0,
      successful_signups: 0,
    });
  });

  it('normalizes engagement rows and filters invalid session modes', async () => {
    mockRpc.mockResolvedValueOnce({ data: [{ audio_id: '', clicks: '2' }], error: null });
    const audio = await fetchAdminAudioEngagement('30d');
    expect(audio.data[0]).toMatchObject({ audio_id: 'unknown_audio', clicks: 2 });

    mockRpc.mockResolvedValueOnce({
      data: [
        { session_mode: 'calm_mind', selections: 1, starts: 1, completes: 1, dropoffs: 0, completion_rate: 1 },
        { session_mode: 'invalid', selections: 99 },
      ],
      error: null,
    });
    const tailored = await fetchAdminTailoredSessions('30d');
    expect(tailored.data).toHaveLength(1);
  });
});
