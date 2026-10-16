import type { Database } from "@mirrorverse/db";
import type { PlanLimits, UsageKind } from "@mirrorverse/types";

import { settleBonusCredits } from "./promo-repo";
import { getActiveSubscription, getTotalCreditsByPeriod } from "./repo";

// Usage may run up to this multiple of `includedCredits` before work is
// refused. Bonus credits are only spent beyond this hard cap.
export const CREDIT_HARD_CAP_RATIO = 1.5;

interface SubscriptionPeriod {
  readonly currentPeriodStart: Date;
  readonly currentPeriodEnd: Date;
}

// Determines the window over which `includedCredits` is allotted/checked.
// "day" plans (e.g. Free) reset at UTC midnight; "billing_period" plans use
// the subscription's current Stripe (or bootstrap) period.
export function getCreditPeriodBounds(
  limits: Pick<PlanLimits, "creditsPeriod"> | null | undefined,
  subscription: SubscriptionPeriod | null | undefined,
): { periodStart: Date; periodEnd: Date } {
  if (limits?.creditsPeriod === "day") {
    const periodStart = new Date();
    periodStart.setUTCHours(0, 0, 0, 0);
    return {
      periodStart,
      periodEnd: new Date(periodStart.getTime() + 86_400_000),
    };
  }
  return {
    periodStart: subscription?.currentPeriodStart ?? new Date(0),
    periodEnd:
      subscription?.currentPeriodEnd ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
}

// Advances a period boundary by one cycle of `creditsPeriod`. Used by the
// subscription-renewal cron (and initial bootstrap) to roll
// currentPeriodStart/End forward once the previous period has elapsed.
export function addPeriod(
  creditsPeriod: PlanLimits["creditsPeriod"],
  from: Date,
): Date {
  if (creditsPeriod === "day") {
    return new Date(from.getTime() + 86_400_000);
  }
  return new Date(from.getFullYear(), from.getMonth() + 1, from.getDate());
}

export class QuotaExceededError extends Error {
  constructor(
    public readonly kind: UsageKind,
    public readonly used: number,
    public readonly limit: number,
  ) {
    super(`Quota exceeded for ${kind}: ${used}/${limit}`);
    this.name = "QuotaExceededError";
  }
}

/** Credits used beyond the plan's hard cap — the portion bonus credits pay for. */
export function bonusOverage(
  usedCredits: number,
  includedCredits: number,
): number {
  return Math.max(0, usedCredits - includedCredits * CREDIT_HARD_CAP_RATIO);
}

/**
 * Bonus credits still available after the current period's overage, given the
 * pool's granted/consumed totals as of the start of the period.
 */
export function remainingBonusCredits(
  pool: { readonly grantedCredits: number; readonly consumedCredits: number },
  usedCredits: number,
  includedCredits: number,
): number {
  const available = Math.max(0, pool.grantedCredits - pool.consumedCredits);
  return Math.max(0, available - bonusOverage(usedCredits, includedCredits));
}

export async function checkCreditQuota(
  db: Database,
  workspaceId: string,
): Promise<void> {
  const row = await getActiveSubscription(db, workspaceId);
  const includedCredits = row?.plan.limits.includedCredits ?? null;
  if (!includedCredits) return;

  const { periodStart, periodEnd } = getCreditPeriodBounds(
    row?.plan.limits,
    row?.subscription,
  );

  const [usedCredits, bonusPool] = await Promise.all([
    getTotalCreditsByPeriod(db, workspaceId, periodStart, periodEnd),
    settleBonusCredits(db, workspaceId, includedCredits, {
      periodStart,
      periodEnd,
    }),
  ]);

  const availableBonus = bonusPool
    ? Math.max(0, bonusPool.grantedCredits - bonusPool.consumedCredits)
    : 0;

  if (usedCredits >= includedCredits * CREDIT_HARD_CAP_RATIO + availableBonus) {
    throw new QuotaExceededError("llm_input", usedCredits, includedCredits);
  }
}
