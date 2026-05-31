import type {
  ContentBlock as SdkContentBlock,
  ContentBlockParam,
  StopReason as SdkStopReason,
  Usage as SdkUsage,
} from "@anthropic-ai/sdk/resources/messages";

import type {
  AgentSkillId,
  ChatEventId,
  ChatId,
  ConnectionRequestId,
  CostBreakdown,
  JsonObject,
  McpServerId,
  MessageId,
  Tenanted,
  Timestamps,
  UserId,
  WorkflowId,
} from "./common.js";

/**
 * Content block stored on a `Message`. Stored shape matches Anthropic's API
 * verbatim so messages can be replayed into the next request without
 * adapter logic. We accept either the response form (`ContentBlock`) for
 * assistant turns or the request form (`ContentBlockParam`) for user turns.
 */
export type ContentBlock = SdkContentBlock | ContentBlockParam;

/** Raw token usage as returned by the Anthropic API. */
export type Usage = SdkUsage;

/**
 * Why a turn ended. Anthropic's set plus our own extensions:
 * - `pause_for_input` — the agent emitted an interrupt (credential / config
 *   / confirmation / clarification) and the chat is now paused.
 * - `error` — runtime error in the agent loop, distinct from a model error.
 */
export type StopReason = SdkStopReason | "pause_for_input" | "error";

export type ChatStatus = "active" | "waiting_for_input" | "completed" | "failed" | "abandoned";

export type ChatPurpose =
  | "generate_workflow"
  | "edit_workflow"
  | "explain_workflow"
  | "debug_run"
  | "free_chat";

/**
 * One conversation between the user and the orchestrator agent. Lives
 * durably so it can pause for hours waiting on credentials or human review.
 * When the chat produces or edits a workflow, `workflowId` links it back.
 */
export interface Chat extends Timestamps, Tenanted {
  readonly id: ChatId;
  readonly userId: UserId;
  readonly purpose: ChatPurpose;
  readonly status: ChatStatus;
  readonly title: string | null;
  readonly workflowId: WorkflowId | null;
  readonly inngestRunId: string | null;
  readonly model: string;
  readonly attachedSkillIds: readonly AgentSkillId[];
  readonly cost: CostBreakdown;
  readonly lastMessageAt: Date | null;
  readonly endedAt: Date | null;
}

export type MessageRole = "user" | "assistant" | "tool" | "system";

/**
 * One turn in a chat. `contentBlocks` is the canonical Anthropic content
 * shape — array of typed blocks (text, thinking, tool_use, tool_result,
 * image, etc.) — so persisted history can be replayed straight into the
 * next API call.
 */
export interface Message extends Timestamps {
  readonly id: MessageId;
  readonly chatId: ChatId;
  readonly role: MessageRole;
  readonly contentBlocks: readonly ContentBlock[];
  readonly cost: CostBreakdown;
  readonly usage: Usage | null;
  readonly model: string | null;
  readonly stopReason: StopReason | null;
  readonly parentMessageId: MessageId | null;
}

export type ChatEventKind =
  | "status_changed"
  | "message_started"
  | "message_delta"
  | "message_completed"
  | "tool_use_started"
  | "tool_use_completed"
  | "interrupt"
  | "resumed"
  | "chat_completed"
  | "chat_failed"
  | "error";

/**
 * State-change stream that drives the chat UI. `sequence` is monotonic per
 * chat so the client can replay from a specific point on reconnect.
 * Append-only — never updated after insert.
 */
export interface ChatEvent {
  readonly id: ChatEventId;
  readonly chatId: ChatId;
  readonly kind: ChatEventKind;
  readonly payload: ChatEventPayload;
  readonly ts: Date;
  readonly sequence: number;
}

export type ChatEventPayload =
  | { readonly kind: "status_changed"; readonly to: ChatStatus }
  | { readonly kind: "message_started"; readonly messageId: MessageId }
  | { readonly kind: "message_delta"; readonly messageId: MessageId; readonly delta: string }
  | { readonly kind: "message_completed"; readonly messageId: MessageId }
  | {
      readonly kind: "tool_use_started";
      readonly messageId: MessageId;
      readonly toolUseId: string;
      readonly toolName: string;
    }
  | {
      readonly kind: "tool_use_completed";
      readonly messageId: MessageId;
      readonly toolUseId: string;
      readonly isError: boolean;
    }
  | { readonly kind: "interrupt"; readonly interrupt: ChatInterrupt }
  | { readonly kind: "resumed"; readonly resolvedInterruptId: string }
  | { readonly kind: "chat_completed"; readonly workflowId: WorkflowId | null }
  | { readonly kind: "chat_failed"; readonly reason: string }
  | { readonly kind: "error"; readonly message: string };

/**
 * Interrupt-for-credential / config / confirmation popup contract. When
 * the agent loop hits a missing credential, ambiguous config, or a
 * destructive action, it pauses and emits one of these. The frontend
 * renders the right popup; the user's response fires `resumeEventName`
 * and the loop continues.
 */
export type ChatInterrupt =
  | NeedsCredentialInterrupt
  | NeedsCredentialsInterrupt
  | NeedsConfigInterrupt
  | NeedsConfirmationInterrupt
  | NeedsClarificationInterrupt;

interface InterruptBase {
  readonly id: string;
  readonly chatId: ChatId;
  readonly resumeEventName: string;
  readonly expiresAt: Date;
}

export interface NeedsCredentialInterrupt extends InterruptBase {
  readonly kind: "needs_credential";
  readonly mcpServerId: McpServerId;
  readonly appSlug: string;
  readonly redirectUrl: string;
  readonly connectionRequestId: ConnectionRequestId;
}

/** Pre-flight multi-app interrupt: all slugs that need connecting before the agent can run. */
export interface NeedsCredentialsInterrupt {
  readonly kind: "needs_credentials";
  readonly id: string;
  readonly chatId: ChatId;
  readonly appSlugs: readonly string[];
}

export interface NeedsConfigInterrupt extends InterruptBase {
  readonly kind: "needs_config";
  readonly schema: JsonObject;
  readonly title: string;
  readonly description: string | null;
}

export interface NeedsConfirmationInterrupt extends InterruptBase {
  readonly kind: "needs_confirmation";
  readonly title: string;
  readonly description: string;
  readonly destructive: boolean;
}

export interface NeedsClarificationInterrupt extends InterruptBase {
  readonly kind: "needs_clarification";
  readonly question: string;
  readonly options: readonly string[] | null;
}
