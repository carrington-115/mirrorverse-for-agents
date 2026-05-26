import type { InngestFunction } from "inngest";
import type { Database } from "@mirrorverse/db";

import { makeBillingAggregatorFunction } from "./functions/billing-aggregator";
import { makeKnowledgeIngestFunction } from "./functions/knowledge-ingest";
import { makeWorkflowExecuteFunction } from "./functions/workflow-execute";

export { inngest } from "./client";
export { workflowExecuteEvent, knowledgeIngestEvent } from "./events";
export type {
  WorkflowExecuteEventData,
  KnowledgeIngestEventData,
} from "./events";

export function buildInngestFunctions(
  db: Database,
): readonly InngestFunction.Any[] {
  return [
    makeWorkflowExecuteFunction(db),
    makeKnowledgeIngestFunction(db),
    makeBillingAggregatorFunction(db),
  ];
}
