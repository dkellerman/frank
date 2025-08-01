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

export * from '@/lib/pydantic-types';
