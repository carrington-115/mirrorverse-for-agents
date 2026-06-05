import type { InngestFunction } from "inngest";
import type { Database } from "@mirrorverse/db";

import { inngest } from "../../inngest/client";
import { workflowExecuteEvent } from "../../inngest/events";
import { findDueCronWorkflows } from "./cron-repo";

/**
 * Runs every minute. Queries for active automation workflows whose cron
 * expression is due and fires a `workflow/execute` event for each.
 *
 * Design: uses a single fat-dispatcher (one Inngest function, DB poll) rather
 * than dynamically registering one `createFunction` per workflow. Reasons:
 * 1. Inngest caps registered functions per app; the set of cron workflows is
 *    unbounded at runtime.
 * 2. Dynamic `createFunction` calls require a server redeploy to take effect.
 * 3. The DB-poll approach handles any cron schedule without Inngest API calls
 *    on workflow activation.
 *
 * Idempotency: the event id encodes `cron:<versionId>:<epochMinute>`, so
 * duplicate fires within the same minute produce at most one run.
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
