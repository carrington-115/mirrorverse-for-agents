import type { InngestFunction } from "inngest";
import type { Database } from "@mirrorverse/db";

import { makeBillingAggregatorFunction } from "./functions/billing-aggregator.js";
import { makeKnowledgeIngestFunction } from "./functions/knowledge-ingest.js";
import { makeWorkflowExecuteFunction } from "./functions/workflow-execute.js";
import { makeCronDispatcherFunction } from "../workflows/runtime/cron-dispatcher.js";

export { inngest } from "./client.js";
export {
  workflowExecuteEvent,
  knowledgeIngestEvent,
  humanReviewRespondedEvent,
} from "./events.js";
export type {
  WorkflowExecuteEventData,
  KnowledgeIngestEventData,
  HumanReviewRespondedEventData,
} from "./events.js";

export function buildInngestFunctions(
  db: Database,
): readonly InngestFunction.Any[] {
  return [
    makeWorkflowExecuteFunction(db),
    makeKnowledgeIngestFunction(db),
    makeBillingAggregatorFunction(db),
    makeCronDispatcherFunction(db),
  ];
}
