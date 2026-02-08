import type { ChatState, SettingsState, AuthState } from '@/types';
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { createChatSlice } from '@/store/chat';
import { createSettingsSlice, setupThemeSubscription } from '@/store/settings';
import { createAuthSlice } from '@/store/auth';

export type StoreState = SettingsState & ChatState & AuthState;

export const useStore = create<StoreState>()(
  subscribeWithSelector(
    persist(
      (...args) => ({
        ...createChatSlice(...args),
        ...createSettingsSlice(...args),
        ...createAuthSlice(...args),
      }),
      {
        name: 'frank-store',
        partialize: (state) => ({
          model: state.model,
          userSelectedModel: state.userSelectedModel,
          themeMode: state.themeMode,
          authToken: state.authToken,
          user: state.user,
        }),
      }
    )
  )
);

setupThemeSubscription(useStore);

useStore.getState().initAuth();
