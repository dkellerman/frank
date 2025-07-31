/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface ErrorEvent {
  type?: "error";
  code: string;
  detail: string;
}
export interface HelloEvent {
  type?: "hello";
  sessionId: string;
}
export interface ReplyEvent {
  type?: "reply";
  text?: string;
  done?: boolean;
}
export interface SendEvent {
  type?: "send";
  message: string;
  direct?: boolean;
  model?: string;
}
