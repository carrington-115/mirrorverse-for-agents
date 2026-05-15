import type { InngestFunction } from "inngest";
import type { Database } from "@mirrorverse/db";

import { makeWorkflowExecuteFunction } from "./functions/workflow-execute";

export { inngest } from "./client";
export { workflowExecuteEvent } from "./events";
export type { WorkflowExecuteEventData } from "./events";

export function buildInngestFunctions(
  db: Database,
): readonly InngestFunction.Any[] {
  return [makeWorkflowExecuteFunction(db)];
}
