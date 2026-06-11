import type { InngestFunction, GetStepTools } from "inngest";
import type { Database } from "@mirrorverse/db";

import { stripe } from "../../billing/stripe-client";
import {
  getDailyUsageSince,
  getHourlyUsageSince,
  getPaidSubscriptions,
  upsertUsagePeriodAggregates,
} from "../../billing/repo";
import { inngest } from "../client";

type StepTools = GetStepTools<typeof inngest>;

const METER_EVENT_NAMES: Record<string, string> = {
  llm_input: "llm_tokens",
  llm_output: "llm_tokens",
  llm_input_cache_read: "llm_tokens",
  llm_input_cache_write: "llm_tokens",
  voice_minute: "voice_minutes",
  sandbox_second: "sandbox_seconds",
};

export function makeBillingAggregatorFunction(
  db: Database,
): InngestFunction.Any {
  return inngest.createFunction(
    {
      id: "billing.aggregator",
      name: "Billing Hourly Aggregator",
      triggers: [{ cron: "0 * * * *" }],
      retries: 2,
    },
    async ({ step }: { step: StepTools }) => {
      await step.run("aggregate-usage", async () => {
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const rows = await getHourlyUsageSince(db, hourAgo, now);
        if (rows.length === 0) return;

        await upsertUsagePeriodAggregates(
          db,
          rows.map((r) => ({
            workspaceId: r.workspaceId,
            periodStart: hourAgo,
            periodEnd: now,
            granularity: "hour" as const,
            kind: r.kind as import("@mirrorverse/types").UsageKind,
            totalQuantity: r.totalQuantity,
            totalCostCents: r.totalCostCents,
            totalCredits: r.totalCredits,
          })),
        );

        // Recompute the full-day aggregate that contains this hour so the
        // daily usage chart stays accurate as events accumulate.
        const dayStart = new Date(hourAgo);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + 86_400_000);
        const dailyRows = await getDailyUsageSince(db, dayStart, dayEnd);
        if (dailyRows.length > 0) {
          await upsertUsagePeriodAggregates(
            db,
            dailyRows.map((r) => ({
              workspaceId: r.workspaceId,
              periodStart: dayStart,
              periodEnd: dayEnd,
              granularity: "day" as const,
              kind: r.kind as import("@mirrorverse/types").UsageKind,
              totalQuantity: r.totalQuantity,
              totalCostCents: r.totalCostCents,
              totalCredits: r.totalCredits,
            })),
          );
        }

        const paidSubs = await getPaidSubscriptions(db);
        const paidWorkspaceIds = new Set(paidSubs.map((s) => s.workspaceId));

        for (const row of rows) {
          if (!paidWorkspaceIds.has(row.workspaceId)) continue;

          const meterName = METER_EVENT_NAMES[row.kind];
          if (!meterName) continue;

          const sub = paidSubs.find((s) => s.workspaceId === row.workspaceId);
          if (!sub?.stripeCustomerId) continue;

          try {
            await stripe.billing.meterEvents.create({
              event_name: meterName,
              // Deterministic key so Stripe deduplicates on Inngest retry.
              identifier: `${row.workspaceId}-${row.kind}-${hourAgo.getTime()}`,
              payload: {
                value: String(row.totalQuantity),
                stripe_customer_id: sub.stripeCustomerId,
              },
            });
          } catch (err) {
            console.error(
              `[billing-aggregator] failed to report meter event for ${row.workspaceId}:`,
              err,
            );
          }
        }
      });
    },
  );
}
