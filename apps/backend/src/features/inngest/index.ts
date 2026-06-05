import type { InngestFunction } from "inngest";
import type { Database } from "@mirrorverse/db";

import { makeBillingAggregatorFunction } from "./functions/billing-aggregator";
import { makeChatAgentLoopFunction } from "./functions/chat-agent-loop";
import { makeEmailCronFunctions } from "./functions/email-crons";
import { makeKnowledgeIngestFunction } from "./functions/knowledge-ingest";
import { makeWorkflowExecuteFunction } from "./functions/workflow-execute";
import { makeCronDispatcherFunction } from "../workflows/runtime/cron-dispatcher";

export { inngest } from "./client";
export {
  chatAgentLoopEvent,
  workflowExecuteEvent,
  knowledgeIngestEvent,
  humanReviewRespondedEvent,
} from "./events";
export type {
  ChatAgentLoopEventData,
  WorkflowExecuteEventData,
  KnowledgeIngestEventData,
  HumanReviewRespondedEventData,
} from "./events";

export function buildInngestFunctions(
  db: Database,
): readonly InngestFunction.Any[] {
  return [
    makeChatAgentLoopFunction(db),
    makeWorkflowExecuteFunction(db),
    makeKnowledgeIngestFunction(db),
    makeBillingAggregatorFunction(db),
    makeCronDispatcherFunction(db),
    ...makeEmailCronFunctions(db),
  ];
}
