import { type StateCreator } from 'zustand';
import type { AuthState } from '@/types';
import { supabase } from '@/supabase';

export const createAuthSlice: StateCreator<AuthState, [], [], AuthState> = (set, get) => {
  return {
    user: null,
    authToken: null,
    authLoading: false,

    signInAnonymously: async () => {
      set({ authLoading: true });
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        set({ authLoading: false });
        throw error;
      }

      set({
        user: data.user,
        authToken: data.session?.access_token || null,
        authLoading: false,
      });
    },

    initAuth: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        console.log('session', session);
        set({
          user: session.user,
          authToken: session.access_token,
        });
      } else {
        console.log('no session, signing in anonymously');
        await get().signInAnonymously();
      }
    },
  };
};
