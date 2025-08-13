import { create, type StateCreator } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type { ChatMessage, ChatModel, ChatState, SettingsState, ThemeMode } from '@/types';

export type StoreState = SettingsState & ChatState;

export const createChatSlice: StateCreator<ChatState, [], [], ChatState> = (set, get) => ({
  history: [],
  setHistory: (history: ChatMessage[]) => set({ history }),
  clearHistory: () => set({ history: [] }),
  addMessage: (message: ChatMessage) => set({ history: [...get().history, message] }),
  loading: false,
  sending: false,
  connected: false,
  startNewChat: () => {},
  sendMessage: () => {},
  loadHistory: async () => {},
});

export const createSettingsSlice: StateCreator<SettingsState, [], [], SettingsState> = (
  set,
  get
) => ({
  models: [],
  model: null as any,
  setModel: (id: string) => set({ model: get().models.find((model) => model.id === id)! }),
  setModels: (models: ChatModel[]) => {
    const currentModel = get().model;
    const defaultModel = models.find((m) => m.isDefault) || models[0];
    const validModel =
      (currentModel && models.find((m) => m.id === currentModel.id)) || defaultModel;
    set({ models, model: validModel });
  },
  themeMode: 'system' as ThemeMode,
  themeLabel: 'System',
  setThemeMode: (mode: ThemeMode) =>
    set({
      themeMode: mode,
      themeLabel: mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System',
    }),
});

export const useStore = create<StoreState>()(
  subscribeWithSelector(
    persist(
      (...args) => ({
        ...createChatSlice(...args),
        ...createSettingsSlice(...args),
      }),
      {
        name: 'frank-store',
        partialize: (state) => ({
          model: state.model,
          themeMode: state.themeMode,
        }),
      }
    )
  )
);

// Apply theme when themeMode changes
useStore.subscribe(
  (state) => state.themeMode,
  (themeMode) => {
    const isDark =
      themeMode === 'dark' ||
      (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }
);
