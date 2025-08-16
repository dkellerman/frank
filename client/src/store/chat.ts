import { type StateCreator } from 'zustand';
import type { ChatState } from '@/types';

export const createChatSlice: StateCreator<ChatState, [], [], ChatState> = (set, get) => {
  return {
    history: [],
    setHistory: (history) => set({ history }),
    clearHistory: () => set({ history: [] }),
    addMessage: (message) => set({ history: [...get().history, message] }),
    loading: false,
    sending: false,
    connected: false,
    startNewChat: () => {},
    sendMessage: () => {},
    loadChat: async () => {},
  };
};
