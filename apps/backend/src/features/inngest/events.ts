import { eventType, staticSchema } from "inngest";

import type { JsonValue } from "@mirrorverse/types";

export interface WorkflowExecuteEventData extends Record<string, unknown> {
  readonly workspaceId: string;
  readonly workflowId: string;
  readonly workflowVersionId: string;
  readonly triggerNodeId: string;
  readonly triggerKind: string;
  readonly triggerPayload: JsonValue;
  readonly initiatedBy: string;
}

export const workflowExecuteEvent = eventType("workflow/execute", {
  schema: staticSchema<WorkflowExecuteEventData>(),
});
