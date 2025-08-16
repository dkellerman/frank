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
}
export interface Chat {
  id: string;
  userId: string;
  history?: (ModelRequest | ModelResponse)[];
  curQuery?: AgentQuery | null;
  pending?: boolean;
}
export interface ModelRequest {
  parts: (SystemPromptPart | UserPromptPart | ToolReturnPart | RetryPromptPart)[];
  instructions?: string | null;
  kind?: "request";
  [k: string]: unknown;
}
export interface SystemPromptPart {
  content: string;
  timestamp?: string;
  dynamic_ref?: string | null;
  part_kind?: "system-prompt";
  [k: string]: unknown;
}
export interface UserPromptPart {
  content: string | (string | ImageUrl | AudioUrl | DocumentUrl | VideoUrl | BinaryContent)[];
  timestamp?: string;
  part_kind?: "user-prompt";
  [k: string]: unknown;
}
export interface ImageUrl {
  url: string;
  force_download?: boolean;
  vendor_metadata?: {
    [k: string]: unknown;
  } | null;
  kind?: "image-url";
  [k: string]: unknown;
}
export interface AudioUrl {
  url: string;
  force_download?: boolean;
  vendor_metadata?: {
    [k: string]: unknown;
  } | null;
  kind?: "audio-url";
  [k: string]: unknown;
}
export interface DocumentUrl {
  url: string;
  force_download?: boolean;
  vendor_metadata?: {
    [k: string]: unknown;
  } | null;
  kind?: "document-url";
  [k: string]: unknown;
}
export interface VideoUrl {
  url: string;
  force_download?: boolean;
  vendor_metadata?: {
    [k: string]: unknown;
  } | null;
  kind?: "video-url";
  [k: string]: unknown;
}
export interface BinaryContent {
  data: string;
  media_type:
    | ("audio/wav" | "audio/mpeg" | "audio/ogg" | "audio/flac" | "audio/aiff" | "audio/aac")
    | ("image/jpeg" | "image/png" | "image/gif" | "image/webp")
    | (
        | "application/pdf"
        | "text/plain"
        | "text/csv"
        | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        | "text/html"
        | "text/markdown"
        | "application/vnd.ms-excel"
      )
    | string;
  identifier?: string | null;
  vendor_metadata?: {
    [k: string]: unknown;
  } | null;
  kind?: "binary";
  [k: string]: unknown;
}
export interface ToolReturnPart {
  tool_name: string;
  content: unknown;
  tool_call_id: string;
  metadata?: {
    [k: string]: unknown;
  };
  timestamp?: string;
  part_kind?: "tool-return";
  [k: string]: unknown;
}
export interface RetryPromptPart {
  content: ErrorDetails[] | string;
  tool_name?: string | null;
  tool_call_id?: string;
  timestamp?: string;
  part_kind?: "retry-prompt";
  [k: string]: unknown;
}
export interface ErrorDetails {
  type: string;
  loc: (number | string)[];
  msg: string;
  input: unknown;
  ctx?: {
    [k: string]: unknown;
  };
  url?: string;
  [k: string]: unknown;
}
export interface ModelResponse {
  parts: (TextPart | ToolCallPart | BuiltinToolCallPart | BuiltinToolReturnPart | ThinkingPart)[];
  usage?: Usage;
  model_name?: string | null;
  timestamp?: string;
  kind?: "response";
  vendor_details?: {
    [k: string]: unknown;
  } | null;
  vendor_id?: string | null;
  [k: string]: unknown;
}
export interface TextPart {
  content: string;
  part_kind?: "text";
  [k: string]: unknown;
}
export interface ToolCallPart {
  tool_name: string;
  args?:
    | string
    | {
        [k: string]: unknown;
      }
    | null;
  tool_call_id?: string;
  part_kind?: "tool-call";
  [k: string]: unknown;
}
export interface BuiltinToolCallPart {
  tool_name: string;
  args?:
    | string
    | {
        [k: string]: unknown;
      }
    | null;
  tool_call_id?: string;
  provider_name?: string | null;
  part_kind?: "builtin-tool-call";
  [k: string]: unknown;
}
export interface BuiltinToolReturnPart {
  tool_name: string;
  content: unknown;
  tool_call_id: string;
  metadata?: {
    [k: string]: unknown;
  };
  timestamp?: string;
  provider_name?: string | null;
  part_kind?: "builtin-tool-return";
  [k: string]: unknown;
}
export interface ThinkingPart {
  content: string;
  id?: string | null;
  signature?: string | null;
  part_kind?: "thinking";
  [k: string]: unknown;
}
export interface Usage {
  requests?: number;
  request_tokens?: number | null;
  response_tokens?: number | null;
  total_tokens?: number | null;
  details?: {
    [k: string]: number;
  } | null;
  [k: string]: unknown;
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
}
export interface InitializeAckEvent {
  type?: "initialize_ack";
  chatId?: string | null;
  models: ChatModel[];
}
export interface InitializeEvent {
  type?: "initialize";
  chatId?: string | null;
}
export interface NewChatAckEvent {
  type?: "new_chat_ack";
  chatId: string;
}
export interface NewChatEvent {
  type?: "new_chat";
  message: string;
  model: string;
}
export interface ReplyEvent {
  type?: "reply";
  text?: string;
  done?: boolean;
}
export interface SendEvent {
  type?: "send";
  chatId: string;
  message: string;
  model: string | null;
}
