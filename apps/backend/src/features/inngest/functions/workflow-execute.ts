import type { InngestFunction } from "inngest";
import { and, eq, schema, type Database } from "@mirrorverse/db";
import type { CostBreakdown, WorkflowDocument } from "@mirrorverse/types";

import { inngest } from "../client";
import { workflowExecuteEvent } from "../events";
import { CostTracker, ZERO_COST } from "../../workflows/runtime/cost-tracker";
import { walkGraph } from "../../workflows/runtime/graph-walker";
import { serializeError } from "../../workflows/runtime/step-writer";

const { workflowRuns, workflowVersions } = schema;

export function makeWorkflowExecuteFunction(db: Database): InngestFunction.Any {
  return inngest.createFunction(
    {
      id: "workflow.execute",
      name: "Workflow Execute",
      triggers: [workflowExecuteEvent],
      retries: 1,
      concurrency: [{ key: "event.data.workflowId", limit: 3 }],
    },
    async ({ event, step }) => {
      const {
        workspaceId,
        workflowId,
        workflowVersionId,
        triggerNodeId,
        triggerKind,
        triggerPayload,
      } = event.data;

      // Step 1: load the workflow document and create the run row atomically.
      const init = await step.run("init", async () => {
        const [version] = await db
          .select({ document: workflowVersions.document })
          .from(workflowVersions)
          .where(
            and(
              eq(workflowVersions.id, workflowVersionId),
              eq(workflowVersions.workspaceId, workspaceId),
            ),
          )
          .limit(1);

        if (!version) {
          throw new Error(
            `workflow.execute: version ${workflowVersionId} not found`,
          );
        }

        const [row] = await db
          .insert(workflowRuns)
          .values({
            workspaceId,
            workflowId,
            workflowVersionId,
            status: "running",
            triggerNodeId,
            triggerKind,
            triggerPayload,
            startedAt: new Date(),
            cost: ZERO_COST,
            inngestRunId: null,
          })
          .returning({ id: workflowRuns.id });

        if (!row) throw new Error("workflow.execute: failed to insert run row");

        return {
          runId: row.id,
          document: version.document as WorkflowDocument,
        };
      });

      const { runId, document } = init;
      const costTracker = new CostTracker();

      // Steps 2..N: walk the graph. Each node executes as its own Inngest step.
      const walkResult = await walkGraph(
        document,
        triggerNodeId,
        triggerPayload,
        {
          db,
          workspaceId,
          runId,
          costTracker,
        },
        step,
      ).catch((err) => ({
        status: "failed" as const,
        totalCost: costTracker.getTotal(),
        error: serializeError(err, null),
      }));

      // Final step: write the run completion status.
      await step.run("finish", async () => {
        const finishedAt = new Date();

        const [startRow] = await db
          .select({ startedAt: workflowRuns.startedAt })
          .from(workflowRuns)
          .where(eq(workflowRuns.id, runId))
          .limit(1);

        const durationMs = startRow
          ? finishedAt.getTime() - startRow.startedAt.getTime()
          : null;

        await db
          .update(workflowRuns)
          .set({
            status: walkResult.status,
            finishedAt,
            durationMs,
            cost: walkResult.totalCost as CostBreakdown,
            error: walkResult.error ?? null,
          })
          .where(eq(workflowRuns.id, runId));
      });

      return { runId, status: walkResult.status };
    },
  );
}
