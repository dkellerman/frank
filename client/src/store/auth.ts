import { type StateCreator } from 'zustand';
import type { AuthState, AuthAnonymousResponse } from '@/types';

export const createAuthSlice: StateCreator<AuthState, [], [], AuthState> = (set, get) => {
  return {
    user: null,
    authToken: null,
    authLoading: false,

    signInAnonymously: async () => {
      set({ authLoading: true });
      const resp = await fetch('/api/auth/anonymous', { method: 'POST' });
      if (!resp.ok) {
        set({ authLoading: false });
        throw new Error(`Auth failed: ${resp.status}`);
      }
      const data = (await resp.json()) as AuthAnonymousResponse;
      set({
        user: data.user,
        authToken: data.authToken || null,
        authLoading: false,
      });
    },

    initAuth: async () => {
      if (get().authToken) {
        console.log('auth: user', { userId: get().user?.id });
        return;
      }
      await get().signInAnonymously();
      console.log('auth: user', { userId: get().user?.id });
    },
  };
};
