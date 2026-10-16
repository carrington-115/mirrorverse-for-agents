import { eq, schema, type Database } from "@mirrorverse/db";
import type { JsonValue } from "@mirrorverse/types";

import { inngest } from "../inngest/client";
import { workflowExecuteEvent } from "../inngest/events";

const { workflows } = schema;

export async function dispatchWebhookRun(
  db: Database,
  endpoint: {
    id: string;
    workspaceId: string;
    workflowId: string;
    triggerNodeId: string;
  },
  triggerPayload: JsonValue,
): Promise<void> {
  const [workflow] = await db
    .select({
      deployedVersionId: workflows.deployedVersionId,
      status: workflows.status,
    })
    .from(workflows)
    .where(eq(workflows.id, endpoint.workflowId))
    .limit(1);

  // Only the pinned deployed version runs; unsaved/undeployed edits never do.
  if (workflow?.status !== "active" || !workflow.deployedVersionId) return;

  await inngest.send(
    workflowExecuteEvent.create({
      workspaceId: endpoint.workspaceId,
      workflowId: endpoint.workflowId,
      workflowVersionId: workflow.deployedVersionId,
      triggerNodeId: endpoint.triggerNodeId,
      triggerKind: "trigger.webhook",
      triggerPayload,
      initiatedBy: "trigger.webhook",
    }),
  );
}
