/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface AgentQuery {
  prompt: string;
  model: string;
  result?: string | null;
  created?: string;
}
export interface Chat {
  id: string;
  userId: string;
  curQuery?: AgentQuery | null;
  pending?: boolean;
  created?: string;
  updated?: string;
}
/**
 * Minimal chat entry for client-side history
 */
export interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  created?: string;
}
/**
 * LLM model configuration
 */
export interface ChatModel {
  id: string;
  label: string;
  isDefault?: boolean;
}
export interface ErrorEvent {
  type?: "error";
  code: string;
  detail: string;
  created?: string;
}
export interface InitializeAckEvent {
  type?: "initialize_ack";
  chatId?: string | null;
  models: ChatModel[];
  created?: string;
}
export interface InitializeEvent {
  type?: "initialize";
  chatId?: string | null;
  created?: string;
}
export interface NewChatAckEvent {
  type?: "new_chat_ack";
  chatId: string;
  created?: string;
}
export interface NewChatEvent {
  type?: "new_chat";
  message: string;
  model: string;
  created?: string;
}
export interface ReplyEvent {
  type?: "reply";
  text?: string;
  done?: boolean;
  created?: string;
}
export interface SendEvent {
  type?: "send";
  chatId: string;
  message: string;
  model: string | null;
  created?: string;
}
export interface UserChat {
  id: string;
  userId: string;
  history?: ChatEntry[];
  curQuery?: AgentQuery | null;
  pending?: boolean;
  created?: string;
  updated?: string;
}
