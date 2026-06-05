import type { InngestFunction } from "inngest";
import { and, count, eq, schema, type Database } from "@mirrorverse/db";
import type { CostBreakdown, WorkflowDocument } from "@mirrorverse/types";

import { inngest } from "../client";
import { workflowExecuteEvent } from "../events";
import { CostTracker, ZERO_COST } from "../../workflows/runtime/cost-tracker";
import { walkGraph } from "../../workflows/runtime/graph-walker";
import { serializeError } from "../../workflows/runtime/step-writer";
import {
  sendFirstWorkflowEmail,
  sendWorkflowFailureEmail,
} from "../../notifications/email";

const { workflowRuns, workflowVersions, workflows, workspaces, userProfiles } =
  schema;

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
            inngestRunId: event.id,
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

      // Look up workspace owner for notification steps
      const owner = await step.run("resolve-owner", async () => {
        const [ws] = await db
          .select({ ownerId: workspaces.ownerId })
          .from(workspaces)
          .where(eq(workspaces.id, workspaceId))
          .limit(1);
        if (!ws) return null;

        const [profile] = await db
          .select({
            email: userProfiles.email,
            fullName: userProfiles.fullName,
            emailOptOut: userProfiles.emailOptOut,
          })
          .from(userProfiles)
          .where(eq(userProfiles.id, ws.ownerId))
          .limit(1);
        return profile
          ? {
              id: ws.ownerId,
              email: profile.email,
              name: profile.fullName ?? "",
              emailOptOut: profile.emailOptOut,
            }
          : null;
      });

      if (owner && !owner.emailOptOut) {
        if (walkResult.status === "failed" && walkResult.error) {
          await step.run("notify-failure", async () => {
            const [wf] = await db
              .select({ name: workflows.name })
              .from(workflows)
              .where(eq(workflows.id, workflowId))
              .limit(1);
            const workflowName = wf?.name ?? "Unknown workflow";
            const errorMsg =
              typeof walkResult.error === "object" && walkResult.error !== null
                ? String(
                    (walkResult.error as unknown as Record<string, unknown>)
                      .message ?? walkResult.error,
                  )
                : String(walkResult.error);
            await sendWorkflowFailureEmail(
              owner.email,
              workflowName,
              errorMsg,
              runId,
            );
          });
        }

        if (walkResult.status === "succeeded") {
          await step.run("notify-first-run", async () => {
            const [{ value: succeededCount }] = await db
              .select({ value: count() })
              .from(workflowRuns)
              .where(
                and(
                  eq(workflowRuns.workspaceId, workspaceId),
                  eq(workflowRuns.status, "succeeded"),
                ),
              );
            if (succeededCount === 1) {
              const [wf] = await db
                .select({ name: workflows.name })
                .from(workflows)
                .where(eq(workflows.id, workflowId))
                .limit(1);
              await sendFirstWorkflowEmail(
                owner.email,
                owner.id,
                wf?.name ?? "your workflow",
              );
            }
          });
        }
      }

      return { runId, status: walkResult.status };
    },
  );
}
