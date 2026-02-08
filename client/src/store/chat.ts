import { type StateCreator } from 'zustand';
import type { ChatState } from '@/types';

export const createChatSlice: StateCreator<ChatState, [], [], ChatState> = (set, get) => {
  return {
    history: [],
    chatTitle: null,
    scrollToTop: false,
    setHistory: (history) => set({ history }),
    clearHistory: () => set({ history: [], chatTitle: null }),
    addMessage: (message) => set({ history: [...get().history, message] }),
    loading: false,
    sending: false,
    connected: false,
    startNewChat: () => {},
    sendMessage: () => {},
    loadChat: async () => {},
  };
};
