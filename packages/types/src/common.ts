/**
 * Shared primitives used across every domain. Dependency-free by design so
 * this module stays a leaf in the workspace graph.
 */

declare const __brand: unique symbol;

/**
 * Branded primitive. At runtime it's just `T`; at compile time the brand
 * blocks accidentally passing one ID where a different ID is expected.
 */
export type Brand<T, B> = T & { readonly [__brand]: B };

export type Id<TBrand extends string> = Brand<string, TBrand>;

export type WorkspaceId = Id<"workspace">;
export type UserId = Id<"user">;
export type ApiKeyId = Id<"api_key">;
export type WorkflowId = Id<"workflow">;
export type WorkflowVersionId = Id<"workflow_version">;
export type WorkflowRunId = Id<"workflow_run">;
export type WorkflowRunStepId = Id<"workflow_run_step">;
export type WorkflowTriggerId = Id<"workflow_trigger">;
export type WebhookEndpointId = Id<"webhook_endpoint">;
export type McpServerId = Id<"mcp_server">;
export type McpDirectoryEntryId = Id<"mcp_directory_entry">;
export type ToolId = Id<"tool">;
export type ConnectionId = Id<"connection">;
export type ConnectionRequestId = Id<"connection_request">;
export type ChatId = Id<"chat">;
export type MessageId = Id<"message">;
export type ChatEventId = Id<"chat_event">;
export type AgentSkillId = Id<"agent_skill">;
export type AgentSkillVersionId = Id<"agent_skill_version">;
export type AgentSkillAttachmentId = Id<"agent_skill_attachment">;
export type KnowledgeBaseId = Id<"knowledge_base">;
export type KnowledgeDocumentId = Id<"knowledge_document">;
export type KnowledgeChunkId = Id<"knowledge_chunk">;
export type VoiceAgentId = Id<"voice_agent">;
export type PhoneNumberId = Id<"phone_number">;
export type VoiceCallId = Id<"voice_call">;
export type PlanId = Id<"plan">;
export type SubscriptionId = Id<"subscription">;
export type UsageEventId = Id<"usage_event">;
export type InvoiceId = Id<"invoice">;
export type AuditLogId = Id<"audit_log">;

export interface Timestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SoftDelete {
  readonly deletedAt: Date | null;
}

export interface Tenanted {
  readonly workspaceId: WorkspaceId;
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface CursorPage<TCursor = string> {
  readonly cursor: TCursor | null;
  readonly limit: number;
}

export interface PageResult<T, TCursor = string> {
  readonly items: readonly T[];
  readonly nextCursor: TCursor | null;
}

export type Cents = number;
export type Tokens = number;

/** Token + cost breakdown for a single LLM call (or rolled up over many). */
export interface CostBreakdown {
  readonly tokensIn: Tokens;
  readonly tokensInCached: Tokens;
  readonly tokensOut: Tokens;
  readonly costCents: Cents;
}
