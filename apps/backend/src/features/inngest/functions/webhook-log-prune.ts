import type { GetStepTools, InngestFunction } from "inngest";
import type { Database } from "@mirrorverse/db";

import { inngest } from "../client";
import { pruneInboundLog } from "../../webhooks/webhook-endpoints-repo";

type StepTools = GetStepTools<typeof inngest>;

// Inbound webhook rows are only needed for debugging and short-window
// idempotency; keep 30 days.
export const WEBHOOK_LOG_RETENTION_DAYS = 30;

export function makeWebhookLogPruneFunction(db: Database): InngestFunction.Any {
  return inngest.createFunction(
    {
      id: "webhooks.inbound-log-prune",
      name: "Webhooks: Prune inbound log",
      triggers: [{ cron: "30 3 * * *" }],
      retries: 1,
    },
    async ({ step }: { step: StepTools }) => {
      const deleted = await step.run("prune", () =>
        pruneInboundLog(
          db,
          new Date(
            Date.now() - WEBHOOK_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000,
          ),
        ),
      );
      return { deleted };
    },
  );
}
