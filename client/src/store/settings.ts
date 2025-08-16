import { type StateCreator } from 'zustand';
import type { ChatModel, SettingsState, ThemeMode } from '@/types';

export const createSettingsSlice: StateCreator<SettingsState, [], [], SettingsState> = (
  set,
  get
) => {
  return {
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
  };
};

export function setupThemeSubscription(useStore: any) {
  useStore.subscribe(
    (state: any) => state.themeMode,
    (themeMode: ThemeMode) => {
      const isDark =
        themeMode === 'dark' ||
        (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    }
  );
}
