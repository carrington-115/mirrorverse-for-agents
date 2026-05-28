import { eq, schema, type Database } from "@mirrorverse/db";
import type {
  CostBreakdown,
  JsonValue,
  RunError,
  RunStepLog,
  RunStepStatus,
} from "@mirrorverse/types";

import { ZERO_COST } from "./cost-tracker";

const { workflowRunSteps } = schema;

export function serializeError(
  err: unknown,
  nodeId: string | null = null,
): RunError {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? (err.stack ?? null) : null;
  return {
    nodeId,
    kind: "node_error",
    message,
    stack,
    retriable: true,
  };
}

/** Deterministic step row id — stable across Inngest retries. */
export function stepRowId(
  runId: string,
  nodeId: string,
  iterIndex?: number,
): string {
  return iterIndex !== undefined
    ? `${runId}:${nodeId}:iter:${iterIndex}`
    : `${runId}:${nodeId}`;
}

export interface WriteStepStartArgs {
  readonly db: Database;
  readonly id: string;
  readonly workspaceId: string;
  readonly runId: string;
  readonly nodeId: string;
  readonly nodeKind: string;
  readonly input: JsonValue;
  readonly attempt?: number;
}

export async function writeStepStart(args: WriteStepStartArgs): Promise<void> {
  await args.db
    .insert(workflowRunSteps)
    .values({
      id: args.id,
      workspaceId: args.workspaceId,
      runId: args.runId,
      nodeId: args.nodeId,
      nodeKind: args.nodeKind,
      attempt: args.attempt ?? 1,
      status: "running",
      startedAt: new Date(),
      input: args.input,
      cost: ZERO_COST,
      logs: [],
    })
    .onConflictDoUpdate({
      target: workflowRunSteps.id,
      set: { status: "running", attempt: args.attempt ?? 1 },
    });
}

export interface WriteStepResultArgs {
  readonly db: Database;
  readonly id: string;
  readonly status: RunStepStatus;
  readonly output?: JsonValue;
  readonly error?: RunError;
  readonly cost?: CostBreakdown;
  readonly logs?: RunStepLog[];
  readonly startedAt: Date;
}

export async function writeStepResult(
  args: WriteStepResultArgs,
): Promise<void> {
  const finishedAt = new Date();
  await args.db
    .update(workflowRunSteps)
    .set({
      status: args.status,
      output: args.output ?? null,
      error: args.error ?? null,
      cost: args.cost ?? ZERO_COST,
      logs: args.logs ?? [],
      finishedAt,
      durationMs: finishedAt.getTime() - args.startedAt.getTime(),
    })
    .where(eq(workflowRunSteps.id, args.id));
}
