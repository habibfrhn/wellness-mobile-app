import { vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

vi.mock('expo-linking', () => ({
  parse: vi.fn(() => ({ path: 'auth/callback', queryParams: {} })),
  openURL: vi.fn(),
}));
