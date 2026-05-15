import type { InngestFunction } from "inngest";
import { eq, schema, type Database } from "@mirrorverse/db";
import type { CostBreakdown } from "@mirrorverse/types";

import { inngest } from "../client";
import { workflowExecuteEvent } from "../events";

const { workflowRuns } = schema;

const ZERO_COST: CostBreakdown = {
  tokensIn: 0,
  tokensInCached: 0,
  tokensOut: 0,
  costCents: 0,
};

export function makeWorkflowExecuteFunction(db: Database): InngestFunction.Any {
  return inngest.createFunction(
    {
      id: "workflow.execute",
      name: "Workflow Execute (stub)",
      triggers: [workflowExecuteEvent],
    },
    async ({ event, step }) => {
      const startedAt = new Date();

      // Phase 1: stub interpreter. Records a workflow_runs row immediately as
      // "succeeded" so the durable wire is proven end-to-end. Real per-node
      // execution lands in Phase 4 (issue #17, follow-up PR).
      const run = await step.run("record-run-start", async () => {
        const [row] = await db
          .insert(workflowRuns)
          .values({
            workspaceId: event.data.workspaceId,
            workflowId: event.data.workflowId,
            workflowVersionId: event.data.workflowVersionId,
            status: "queued",
            triggerNodeId: event.data.triggerNodeId,
            triggerKind: event.data.triggerKind,
            triggerPayload: event.data.triggerPayload,
            startedAt,
            cost: ZERO_COST,
            inngestRunId: null,
          })
          .returning({ id: workflowRuns.id });
        return row;
      });

      if (!run) {
        throw new Error("Failed to record workflow_run row");
      }

      await step.run("mark-run-succeeded", async () => {
        const finishedAt = new Date();
        await db
          .update(workflowRuns)
          .set({
            status: "succeeded",
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
          })
          .where(eq(workflowRuns.id, run.id));
      });

      return { runId: run.id, status: "succeeded" as const };
    },
  );
}
