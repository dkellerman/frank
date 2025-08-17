/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

/**
 * User query to the agent and result
 */
export interface AgentQuery {
  prompt: string;
  model: string;
  result?: string | null;
  ts?: string;
}
/**
 * Chat session for server
 */
export interface Chat {
  id: string;
  userId: string;
  title?: string | null;
  model?: string | null;
  curQuery?: AgentQuery | null;
  pending?: boolean;
  ts?: string;
  updatedAt?: string;
}
/**
 * Minimal chat entry for client-side history
 */
export interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  ts?: string;
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
  ts?: string;
}
/**
 * Server sends this to acknowledge the client's initialization request
 */
export interface InitializeAckEvent {
  type?: "initialize_ack";
  chatId?: string | null;
  models: ChatModel[];
  ts?: string;
}
/**
 * Client sends this first to initialize a chat session
 */
export interface InitializeEvent {
  type?: "initialize";
  chatId?: string | null;
  ts?: string;
}
/**
 * Server sends this to acknowledge the client's new chat request and
 * send the new chat ID
 */
export interface NewChatAckEvent {
  type?: "new_chat_ack";
  chatId: string;
  ts?: string;
}
/**
 * Client sends this to start a new chat session
 */
export interface NewChatEvent {
  type?: "new_chat";
  message: string;
  model: string;
  ts?: string;
}
/**
 * Server sends this to reply (partially) to the client's message
 */
export interface ReplyEvent {
  type?: "reply";
  text?: string;
  done?: boolean;
  ts?: string;
}
/**
 * Client sends this to send a message to the agent
 */
export interface SendEvent {
  type?: "send";
  chatId: string;
  message: string;
  model: string | null;
  ts?: string;
}
/**
 * Chat session for client, with history converted to ChatEntry list
 */
export interface UserChat {
  id: string;
  userId: string;
  title?: string | null;
  model?: string | null;
  curQuery?: AgentQuery | null;
  pending?: boolean;
  ts?: string;
  updatedAt?: string;
  history?: ChatEntry[];
}
