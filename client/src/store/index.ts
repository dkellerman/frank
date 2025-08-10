import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ChatModel, ChatState, SettingsState } from '@/types';

const MODELS: ChatModel[] = [
  { id: 'openrouter:openai/gpt-5', label: 'GPT-5' },
  { id: 'openrouter:openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { id: 'openrouter:openai/gpt-5-nano', label: 'GPT-5 Nano', isDefault: true },
  { id: 'openrouter:openai/gpt-oss-20b', label: 'GPT-OSS 20B (small)' },
  { id: 'openrouter:anthropic/claude-4.1', label: 'Claude 4.1' },
  { id: 'openrouter:meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (free)' },
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
  loading: false,
  sending: false,
  connected: false,
  startNewChat: () => {},
  sendMessage: () => {},
  loadHistory: async () => {},
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
