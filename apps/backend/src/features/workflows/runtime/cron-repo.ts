import { and, eq, schema, type Database } from "@mirrorverse/db";
import type { WorkflowDocument } from "@mirrorverse/types";
import { Cron } from "croner";

const { workflows, workflowVersions } = schema;

export interface DueCronWorkflow {
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly versionId: string;
  readonly triggerNodeId: string;
  readonly expression: string;
  readonly timezone: string;
}

/**
 * Returns all active automation workflows whose deployed version has a
 * `trigger.cron` node whose expression is due to fire at `now` (within
 * the current minute boundary).
 */
export async function findDueCronWorkflows(
  db: Database,
  now: Date,
): Promise<DueCronWorkflow[]> {
  const rows = await db
    .select({
      workspaceId: workflows.workspaceId,
      workflowId: workflows.id,
      versionId: workflowVersions.id,
      document: workflowVersions.document,
    })
    .from(workflows)
    .innerJoin(
      workflowVersions,
      eq(workflowVersions.id, workflows.deployedVersionId),
    )
    .where(
      and(eq(workflows.status, "active"), eq(workflows.kind, "automation")),
    );

  const due: DueCronWorkflow[] = [];

  for (const row of rows) {
    const doc = row.document as WorkflowDocument;
    const triggerNode = doc.nodes.find((n) => n.type === "trigger.cron");
    if (!triggerNode) continue;

    const expression =
      (triggerNode.params.expression as string | undefined) ?? "";
    const timezone =
      (triggerNode.params.timezone as string | undefined) ?? "UTC";
    if (!expression) continue;

    try {
      const cron = new Cron(expression, { timezone });
      // isDue: find the next occurrence starting from one minute ago. If it
      // falls within the current minute, the expression is due now.
      // Using nextRun(minuteAgo) instead of previousRun() because previousRun()
      // tracks actual callback execution history — a fresh Cron instance with no
      // callback always returns undefined, so cron workflows would never fire.
      const minuteAgo = new Date(now.getTime() - 60_000);
      const prev = cron.nextRun(minuteAgo);
      if (prev && isWithinCurrentMinute(prev, now)) {
        due.push({
          workspaceId: row.workspaceId,
          workflowId: row.workflowId,
          versionId: row.versionId,
          triggerNodeId: triggerNode.id,
          expression,
          timezone,
        });
      }
    } catch {
      // Invalid cron expression — skip silently.
    }
  }

  return due;
}

function isWithinCurrentMinute(date: Date, now: Date): boolean {
  // True if `date` falls within the same clock minute as `now`.
  const minuteStart = new Date(now);
  minuteStart.setSeconds(0, 0);
  const minuteEnd = new Date(minuteStart.getTime() + 60_000);
  return date >= minuteStart && date < minuteEnd;
}
