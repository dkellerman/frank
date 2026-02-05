import type * as types from '@/lib/pydantic-types';

export type ChatEvent =
  | types.ErrorEvent
  | types.InitializeEvent
  | types.InitializeAckEvent
  | types.NewChatEvent
  | types.NewChatAckEvent
  | types.ReplyEvent
  | types.SendEvent;

export const EventType = {
  INITIALIZE: 'initialize',
  INITIALIZE_ACK: 'initialize_ack',
  NEW_CHAT: 'new_chat',
  NEW_CHAT_ACK: 'new_chat_ack',
  REPLY: 'reply',
  SEND: 'send',
  ERROR: 'error',
} as const;

export type EventTypeValue = (typeof EventType)[keyof typeof EventType];

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ChatState {
  history: types.ChatEntry[];
  setHistory: (history: types.ChatEntry[]) => void;
  clearHistory: () => void;
  addMessage: (message: types.ChatEntry) => void;
  loading: boolean;
  sending: boolean;
  connected: boolean;
  startNewChat: () => void;
  sendMessage: (message: string) => void;
  loadChat: (chatId: string) => Promise<void>;
}

export interface SettingsState {
  models: types.ChatModel[];
  model: types.ChatModel | null;
  setModel: (id: string) => void;
  setModels: (models: types.ChatModel[]) => void;
  themeMode: ThemeMode;
  themeLabel: string;
  setThemeMode: (mode: ThemeMode) => void;
}

export interface AuthState {
  user: types.AuthUserOut | null;
  authToken: string | null;
  authLoading: boolean;
  signInAnonymously: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export * from '@/lib/pydantic-types';
