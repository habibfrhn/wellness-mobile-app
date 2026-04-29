import { renderHook, waitFor } from '@testing-library/react-native';
import { useAdminAnalytics } from '../useAdminAnalytics';

const mockFetchProduct = jest.fn();
const mockFetchAudio = jest.fn();
const mockFetchTailored = jest.fn();

jest.mock('../../services/adminAnalytics', () => ({
  fetchAdminProductActions: (...args: unknown[]) => mockFetchProduct(...args),
  fetchAdminAudioEngagement: (...args: unknown[]) => mockFetchAudio(...args),
  fetchAdminTailoredSessions: (...args: unknown[]) => mockFetchTailored(...args),
  isAdminUnauthorizedError: (error: { code?: string }) => error?.code === '42501',
}));

describe('useAdminAnalytics', () => {
  beforeEach(() => {
    mockFetchProduct.mockResolvedValue({ data: { home_sleep_clicks: 1, tailored_session_selections: 2, tailored_session_starts: 3, successful_signups: 4 }, error: null });
    mockFetchAudio.mockResolvedValue({ data: [], error: null });
    mockFetchTailored.mockResolvedValue({ data: [], error: null });
  });

  it('loads admin panel data and keeps it available after refresh action', async () => {
    const { result } = renderHook(() => useAdminAnalytics(true));

    await waitFor(() => expect(result.current.busy).toBe(false));
    expect(result.current.productActions?.successful_signups).toBe(4);

    await result.current.reload('7d');
    expect(mockFetchProduct).toHaveBeenCalledWith('7d');
  });

  it('flags unauthorized users from admin functionality', async () => {
    mockFetchProduct.mockResolvedValueOnce({ data: null, error: { code: '42501', message: 'not authorized' } });

    const { result } = renderHook(() => useAdminAnalytics(true));
    await waitFor(() => expect(result.current.busy).toBe(false));

    expect(result.current.unauthorized).toBe(true);
  });

  it('resets state when admin access is disabled (protected route behavior)', async () => {
    const { result, rerender } = renderHook(({ enabled }) => useAdminAnalytics(enabled), { initialProps: { enabled: true } });
    await waitFor(() => expect(result.current.busy).toBe(false));

    rerender({ enabled: false });
    expect(result.current.productActions).toBeNull();
    expect(result.current.audioRows).toEqual([]);
  });
});
