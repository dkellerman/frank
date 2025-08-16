import { type StateCreator } from 'zustand';
import type { ChatMessage, ChatState } from '@/types';

export const createChatSlice: StateCreator<ChatState, [], [], ChatState> = (set, get) => {
  return {
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
  };
};
