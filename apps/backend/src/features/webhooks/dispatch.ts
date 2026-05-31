import { eq, schema, type Database } from "@mirrorverse/db";
import type { JsonValue } from "@mirrorverse/types";

import { inngest } from "../inngest/client.js";
import { workflowExecuteEvent } from "../inngest/events.js";

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
    .select({ currentVersionId: workflows.currentVersionId })
    .from(workflows)
    .where(eq(workflows.id, endpoint.workflowId))
    .limit(1);

  if (!workflow?.currentVersionId) return;

  await inngest.send(
    workflowExecuteEvent.create({
      workspaceId: endpoint.workspaceId,
      workflowId: endpoint.workflowId,
      workflowVersionId: workflow.currentVersionId,
      triggerNodeId: endpoint.triggerNodeId,
      triggerKind: "trigger.webhook",
      triggerPayload,
      initiatedBy: "trigger.webhook",
    }),
  );
}
