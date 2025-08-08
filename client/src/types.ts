import type * as types from '@/lib/pydantic-types';

export type ChatEvent =
  | types.ErrorEvent
  | types.InitializeEvent
  | types.NewChatEvent
  | types.NewChatAckEvent
  | types.ReplyEvent
  | types.SendEvent;

export const EventType = {
  INITIALIZE: 'initialize',
  NEW_CHAT: 'new_chat',
  NEW_CHAT_ACK: 'new_chat_ack',
  REPLY: 'reply',
  SEND: 'send',
  ERROR: 'error',
} as const;

export type EventTypeValue = (typeof EventType)[keyof typeof EventType];

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatModel {
  id: string;
  label: string;
  isDefault?: boolean;
}

export interface ChatState {
  history: ChatMessage[];
  setHistory: (history: ChatMessage[]) => void;
  clearHistory: () => void;
  addMessage: (message: ChatMessage) => void;
}

export interface SettingsState {
  models: ChatModel[];
  model: ChatModel;
  setModel: (id: string) => void;
}

export * from '@/lib/pydantic-types';
