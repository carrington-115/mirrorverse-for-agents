import type { ToolUIPart } from "ai";

import type { WorkflowKind } from "@/features/chat/config";

export const WORKFLOW_COMMIT_TOOL_TYPE = "tool-workflow_commit" as const;

export type WorkflowCommitToolPart = ToolUIPart & { type: typeof WORKFLOW_COMMIT_TOOL_TYPE };

export interface WorkflowCommitInput {
  readonly summary?: string;
  readonly intent?: string;
}

export interface WorkflowCommitResult {
  readonly workflowId: string;
  readonly workflowVersionId: string;
  readonly versionNumber: number;
  readonly title: string;
  readonly kind: WorkflowKind;
}

export type WorkflowCommitStatus = "building" | "ready" | "failed";

export function readWorkflowCommitResult(
  part: WorkflowCommitToolPart,
): WorkflowCommitResult | undefined {
  if (part.state !== "output-available") return undefined;
  return part.output as WorkflowCommitResult;
}

export function readWorkflowCommitStatus(part: WorkflowCommitToolPart): WorkflowCommitStatus {
  if (part.state === "output-available") return "ready";
  if (part.state === "output-error") return "failed";
  return "building";
}

export function isWorkflowCommitPart<T extends { type: string }>(
  part: T,
): part is T & { type: typeof WORKFLOW_COMMIT_TOOL_TYPE } {
  return part.type === WORKFLOW_COMMIT_TOOL_TYPE;
}
