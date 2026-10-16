import { eq, schema, type Database } from "@mirrorverse/db";
import type { JsonValue } from "@mirrorverse/types";

import { inngest } from "../inngest/client";
import { workflowExecuteEvent } from "../inngest/events";
import { checkRunLimit } from "../billing/run-limits";

const { workflows } = schema;

export type DispatchResult =
  | { readonly dispatched: true }
  | { readonly dispatched: false; readonly reason: "inactive" }
  | {
      readonly dispatched: false;
      readonly reason: "run_limit";
      readonly message: string;
    };

export async function dispatchWebhookRun(
  db: Database,
  endpoint: {
    id: string;
    workspaceId: string;
    workflowId: string;
    triggerNodeId: string;
  },
  triggerPayload: JsonValue,
): Promise<DispatchResult> {
  const [workflow] = await db
    .select({
      deployedVersionId: workflows.deployedVersionId,
      status: workflows.status,
    })
    .from(workflows)
    .where(eq(workflows.id, endpoint.workflowId))
    .limit(1);

  // Only the pinned deployed version runs; unsaved/undeployed edits never do.
  if (workflow?.status !== "active" || !workflow.deployedVersionId) {
    return { dispatched: false, reason: "inactive" };
  }

  const runLimit = await checkRunLimit(db, endpoint.workspaceId);
  if (!runLimit.ok) {
    return {
      dispatched: false,
      reason: "run_limit",
      message: runLimit.message,
    };
  }

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
  return { dispatched: true };
}
