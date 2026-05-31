import type {
  CostBreakdown,
  JsonObject,
  JsonValue,
  Tenanted,
  Timestamps,
  WorkflowId,
  WorkflowRunId,
  WorkflowRunStepId,
  WorkflowVersionId,
} from "./common.js";

export type RunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "timed_out"
  | "waiting_for_input";

/** One execution of a workflow. The canonical row in the run history. */
export interface WorkflowRun extends Timestamps, Tenanted {
  readonly id: WorkflowRunId;
  readonly workflowId: WorkflowId;
  readonly workflowVersionId: WorkflowVersionId;
  readonly status: RunStatus;
  readonly triggerNodeId: string;
  readonly triggerKind: string;
  readonly triggerPayload: JsonValue;
  readonly startedAt: Date;
  readonly finishedAt: Date | null;
  readonly durationMs: number | null;
  readonly inngestRunId: string | null;
  readonly cost: CostBreakdown;
  readonly error: RunError | null;
}

export interface RunError {
  readonly nodeId: string | null;
  readonly kind:
    | "node_error"
    | "timeout"
    | "rate_limited"
    | "auth_error"
    | "validation_error"
    | "internal";
  readonly message: string;
  readonly stack: string | null;
  readonly retriable: boolean;
}

export type RunStepStatus = RunStatus | "skipped";

/** One node's execution within a run. Powers the run-history debugger. */
export interface WorkflowRunStep extends Timestamps, Tenanted {
  readonly id: WorkflowRunStepId;
  readonly runId: WorkflowRunId;
  readonly nodeId: string;
  readonly nodeKind: string;
  readonly attempt: number;
  readonly status: RunStepStatus;
  readonly startedAt: Date;
  readonly finishedAt: Date | null;
  readonly durationMs: number | null;
  readonly input: JsonValue;
  readonly output: JsonValue | null;
  readonly error: RunError | null;
  readonly cost: CostBreakdown;
  readonly logs: readonly RunStepLog[];
}

export interface RunStepLog {
  readonly ts: Date;
  readonly level: "debug" | "info" | "warn" | "error";
  readonly message: string;
  readonly data: JsonObject | null;
}

/** Open human-in-the-loop request, blocking a run until resolved. */
export interface PendingHumanReview extends Timestamps, Tenanted {
  readonly id: string;
  readonly runId: WorkflowRunId;
  readonly stepId: WorkflowRunStepId;
  readonly nodeId: string;
  readonly prompt: string;
  readonly responseSchema: JsonObject | null;
  readonly channel: string;
  readonly externalMessageId: string | null;
  readonly expiresAt: Date;
  readonly resolvedAt: Date | null;
  readonly response: JsonValue | null;
}
