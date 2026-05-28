import type { InngestFunction } from "inngest";
import type { Database } from "@mirrorverse/db";

import { inngest, workflowExecuteEvent } from "../../inngest";
import { findDueCronWorkflows } from "./cron-repo";

/**
 * Runs every minute. Queries for active automation workflows whose cron
 * expression is due and fires a `workflow/execute` event for each.
 *
 * Idempotency is handled by Inngest's event deduplication: the event id
 * encodes the versionId + epoch minute, so duplicate fires in the same minute
 * produce at most one run.
 */
export function makeCronDispatcherFunction(db: Database): InngestFunction.Any {
  return inngest.createFunction(
    {
      id: "workflow.cron-dispatch",
      name: "Workflow Cron Dispatcher",
      triggers: [{ cron: "* * * * *" }],
      retries: 0, // cron misses are acceptable; don't retry stale dispatches
    },
    async ({ step }) => {
      await step.run("fan-out-cron-workflows", async () => {
        const now = new Date();
        const dueWorkflows = await findDueCronWorkflows(db, now);

        if (dueWorkflows.length === 0) return { dispatched: 0 };

        const epochMinute = Math.floor(now.getTime() / 60_000);

        await Promise.all(
          dueWorkflows.map((w) =>
            inngest.send({
              ...workflowExecuteEvent.create({
                workspaceId: w.workspaceId,
                workflowId: w.workflowId,
                workflowVersionId: w.versionId,
                triggerNodeId: w.triggerNodeId,
                triggerKind: "trigger.cron",
                triggerPayload: {
                  scheduledAt: now.toISOString(),
                  expression: w.expression,
                },
                initiatedBy: "trigger.cron",
              }),
              // Stable id ensures Inngest deduplicates within the same minute.
              id: `cron:${w.versionId}:${epochMinute}`,
            }),
          ),
        );

        return { dispatched: dueWorkflows.length };
      });
    },
  );
}
