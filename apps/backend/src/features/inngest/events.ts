import { eventType, staticSchema } from "inngest";

import type { JsonValue } from "@mirrorverse/types";

export interface WorkflowExecuteEventData extends Record<string, unknown> {
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly workflowVersionId: string;
  readonly triggerNodeId: string;
  readonly triggerKind: string;
  readonly triggerPayload: JsonValue;
  readonly initiatedBy: string;
}

export const workflowExecuteEvent = eventType("workflow/execute", {
  schema: staticSchema<WorkflowExecuteEventData>(),
});

export interface KnowledgeIngestEventData extends Record<string, unknown> {
  readonly documentId: string;
  readonly kbId: string;
  readonly workspaceId: string;
  readonly sourceType: "pdf" | "url" | "text" | "image" | "file";
  /**
   * Raw text content for "text", URL for "url", and a signed Supabase Storage
   * URL for "pdf" / "image" / "file".
   */
  readonly contentOrUrl: string;
  /** MIME type for "file" (and optionally "image"); drives parser selection. */
  readonly mediaType?: string;
  /** Original file name; used as a fallback hint for parser selection. */
  readonly fileName?: string;
}

export const knowledgeIngestEvent = eventType("knowledge/ingest", {
  schema: staticSchema<KnowledgeIngestEventData>(),
});

export interface HumanReviewRespondedEventData extends Record<string, unknown> {
  readonly runId: string;
  readonly nodeId: string;
  readonly response: unknown;
}

export const humanReviewRespondedEvent = eventType("human.review.responded", {
  schema: staticSchema<HumanReviewRespondedEventData>(),
});
