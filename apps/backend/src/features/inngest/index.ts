import type { InngestFunction } from "inngest";
import type { Database } from "@mirrorverse/db";

import { makeBillingAggregatorFunction } from "./functions/billing-aggregator";
import { makeKnowledgeIngestFunction } from "./functions/knowledge-ingest";
import { makeWorkflowExecuteFunction } from "./functions/workflow-execute";
import { makeCronDispatcherFunction } from "../workflows/runtime/cron-dispatcher";

export { inngest } from "./client";
export {
  workflowExecuteEvent,
  knowledgeIngestEvent,
  humanReviewRespondedEvent,
} from "./events";
export type {
  WorkflowExecuteEventData,
  KnowledgeIngestEventData,
  HumanReviewRespondedEventData,
} from "./events";

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
