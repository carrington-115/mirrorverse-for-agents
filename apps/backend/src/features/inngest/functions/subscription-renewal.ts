import type { InngestFunction, GetStepTools } from "inngest";
import type { Database } from "@mirrorverse/db";

import { addPeriod } from "../../billing/enforcement";
import {
  getExpiredActiveSubscriptions,
  renewSubscriptionPeriod,
} from "../../billing/repo";
import { inngest } from "../client";

type StepTools = GetStepTools<typeof inngest>;

// Rolls subscriptions.currentPeriodStart/End forward once the current
// period has elapsed. Stripe webhooks keep paid subscriptions current on
// renewal, but "manual-free-*" subscriptions (and any paid subscription
// whose renewal webhook was missed) have no other mechanism to advance —
// without this, maxRunsPerMonth / maxWorkflowGenerationsPerPeriod and the
// usage charts would freeze at the period set when the subscription was
// first created.
export function makeSubscriptionRenewalFunction(
  db: Database,
): InngestFunction.Any {
  return inngest.createFunction(
    {
      id: "billing.subscription-renewal",
      name: "Billing: Subscription Period Renewal",
      triggers: [{ cron: "0 0 * * *" }],
      retries: 2,
    },
    async ({ step }: { step: StepTools }) => {
      await step.run("renew-expired-periods", async () => {
        const now = new Date();
        const expired = await getExpiredActiveSubscriptions(db, now);

        for (const { subscription, plan } of expired) {
          let periodStart = subscription.currentPeriodEnd;
          let periodEnd = addPeriod(plan.limits.creditsPeriod, periodStart);
          // Catch up workspaces that missed multiple cycles while dormant.
          while (periodEnd <= now) {
            periodStart = periodEnd;
            periodEnd = addPeriod(plan.limits.creditsPeriod, periodStart);
          }

          await renewSubscriptionPeriod(
            db,
            subscription.id,
            periodStart,
            periodEnd,
          ).catch((err) => {
            console.error(
              "[billing] subscription renewal failed for",
              subscription.id,
              err,
            );
          });
        }
      });
    },
  );
}
