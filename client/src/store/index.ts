import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ChatModel, ChatState, SettingsState } from '@/types';

const MODELS: ChatModel[] = [
  { id: 'google-gla:gemini-2.5-flash', label: 'Gemini 2.5 Flash', isDefault: true },
  { id: 'anthropic:claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { id: 'groq:meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout' },
  { id: 'openai:gpt-4o', label: 'GPT-4o' },
  { id: 'grok:grok-4', label: 'Grok 4' },
];

export type StoreState = SettingsState & ChatState;

export const createSettingsSlice: StateCreator<SettingsState, [], [], SettingsState> = (set) => ({
  models: MODELS,
  model: MODELS.find((model) => model.isDefault)!,
  setModel: (id: string) => set({ model: MODELS.find((model) => model.id === id)! }),
});

export const createChatSlice: StateCreator<ChatState, [], [], ChatState> = (set, get) => ({
  history: [],
  setHistory: (history: ChatMessage[]) => set({ history }),
  clearHistory: () => set({ history: [] }),
  addMessage: (message: ChatMessage) => set({ history: [...get().history, message] }),
});

export const useStore = create<StoreState>()(
  persist(
    (...args) => ({
      ...createChatSlice(...args),
      ...createSettingsSlice(...args),
    }),
    {
      name: 'frank-store',
      partialize: (state) => ({
        model: state.model,
      }),
    }
  )
);
