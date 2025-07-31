import type * as types from '@/lib/pydantic-types';

export type ChatEvent = types.ErrorEvent | types.HelloEvent | types.ReplyEvent | types.SendEvent;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export * from '@/lib/pydantic-types';
