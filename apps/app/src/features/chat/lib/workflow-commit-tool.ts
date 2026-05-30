import type { ToolUIPart } from "ai";
import { PenLine, Workflow } from "lucide-react";

import type { WorkflowKind } from "@/features/chat/config";
import { registerTool } from "./tool-registry";

export const WORKFLOW_COMMIT_TOOL_TYPE = "tool-workflow_commit" as const;

registerTool(WORKFLOW_COMMIT_TOOL_TYPE, {
  label: "Building workflow",
  icon: Workflow,
  beforeToolIcon: PenLine,
});

export type WorkflowCommitToolPart = ToolUIPart & { type: typeof WORKFLOW_COMMIT_TOOL_TYPE };

export interface WorkflowCommitInput {
  readonly summary?: string;
  readonly intent?: string;
}

export interface WorkflowCommitSuccess {
  readonly ok: true;
  readonly workflowId: string;
  readonly workflowVersionId: string;
  readonly versionNumber: number;
  readonly title: string;
  readonly kind: WorkflowKind;
  readonly document?: unknown;
}

export interface WorkflowCommitFailure {
  readonly ok: false;
  readonly error: string;
}

export type WorkflowCommitOutput = WorkflowCommitSuccess | WorkflowCommitFailure;

export type WorkflowCommitStatus = "building" | "ready" | "failed";

export function readWorkflowCommitOutput(
  part: WorkflowCommitToolPart,
): WorkflowCommitOutput | undefined {
  if (part.state !== "output-available") return undefined;
  return part.output as WorkflowCommitOutput;
}

export function readWorkflowCommitResult(
  part: WorkflowCommitToolPart,
): WorkflowCommitSuccess | undefined {
  const output = readWorkflowCommitOutput(part);
  if (!output || !output.ok) return undefined;
  return output;
}

export function readWorkflowCommitStatus(part: WorkflowCommitToolPart): WorkflowCommitStatus {
  const output = readWorkflowCommitOutput(part);
  if (output) return output.ok ? "ready" : "failed";
  if (part.state === "output-error") return "failed";
  return "building";
}

export function readWorkflowCommitError(part: WorkflowCommitToolPart): string | undefined {
  const output = readWorkflowCommitOutput(part);
  if (output && !output.ok) return output.error;
  if (part.state === "output-error" && part.errorText) return part.errorText;
  return undefined;
}

export function isWorkflowCommitPart<T extends { type: string }>(
  part: T,
): part is T & { type: typeof WORKFLOW_COMMIT_TOOL_TYPE } {
  return part.type === WORKFLOW_COMMIT_TOOL_TYPE;
}
