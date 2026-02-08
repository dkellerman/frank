import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuthSlice } from './auth';
import type { AuthState } from '@/types';

function createTestStore(): AuthState {
  let state: AuthState = {} as AuthState;
  const set = (partial: Partial<AuthState>) => {
    Object.assign(state, partial);
  };
  const get = () => state;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state = createAuthSlice(set as any, get as any, {} as any);
  return state;
}

describe('auth store slice', () => {
  let store: AuthState;

  beforeEach(() => {
    store = createTestStore();
    vi.restoreAllMocks();
  });

  it('initializes with null user and token', () => {
    expect(store.user).toBeNull();
    expect(store.authToken).toBeNull();
    expect(store.authLoading).toBe(false);
  });

  it('signInAnonymously fetches and sets auth data', async () => {
    const mockResponse = {
      user: { id: 'user-123' },
      authToken: 'token-abc',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await store.signInAnonymously();

    expect(store.user).toEqual({ id: 'user-123' });
    expect(store.authToken).toBe('token-abc');
    expect(store.authLoading).toBe(false);
  });

  it('signInAnonymously throws on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(store.signInAnonymously()).rejects.toThrow('Auth failed: 500');
    expect(store.authLoading).toBe(false);
  });

  it('initAuth skips fetch if token already exists', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    store.authToken = 'existing-token';

    await store.initAuth();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('initAuth calls signInAnonymously if no token', async () => {
    const mockResponse = {
      user: { id: 'user-456' },
      authToken: 'token-def',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await store.initAuth();

    expect(store.authToken).toBe('token-def');
  });
});
