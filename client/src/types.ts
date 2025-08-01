import type * as types from '@/lib/pydantic-types';

export type ChatEvent =
  | types.ErrorEvent
  | types.InitializeEvent
  | types.ReplyEvent
  | types.SendEvent;

export const EventType = {
  INITIALIZE: 'initialize',
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
  sessionId: string;
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
