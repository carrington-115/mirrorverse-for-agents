import type { Database } from "@mirrorverse/db";

import {
  cacheKeys,
  getCounter,
  incrementCounterIfPresent,
  isCacheEnabled,
  seedCounter,
} from "../../lib/cache";
import { getCreditPeriodBounds } from "./enforcement";
import { getActiveSubscription, getTotalCreditsByPeriod } from "./repo";

// Per-workspace, per-period "credits used" counter in Redis. It only speeds
// up the quota read: usage_events in Postgres stays the source of truth.
//
// The TTL is deliberately much shorter than a credit period. Any drift (an
// increment lost to a Redis blip, a usage write rolled back after the
// counter was bumped) disappears when the counter expires and is re-seeded,
// at the cost of one aggregate query per workspace every 15 minutes.
export const CREDITS_USED_TTL_SECONDS = 15 * 60;

interface CreditPeriod {
  readonly periodStart: Date;
  readonly periodEnd: Date;
}

/** Credits used in `period`: counter hit, else Postgres (seeding the counter). */
export async function getCreditsUsed(
  db: Database,
  workspaceId: string,
  period: CreditPeriod,
): Promise<number> {
  const key = cacheKeys.creditsUsed(workspaceId, period.periodStart);
  const hit = await getCounter(key);
  if (hit !== null) return hit;

  const used = await getTotalCreditsByPeriod(
    db,
    workspaceId,
    period.periodStart,
    period.periodEnd,
  );
  await seedCounter(key, used, CREDITS_USED_TTL_SECONDS);
  return used;
}

/**
 * Adds newly recorded credits to the current period's counter. Pass only the
 * credits of rows that were actually inserted (idempotent retries that hit
 * ON CONFLICT DO NOTHING must not count twice). A counter that isn't seeded
 * yet is left alone; the next read seeds it from Postgres.
 */
export async function addCreditsUsed(
  db: Database,
  workspaceId: string,
  credits: number,
): Promise<void> {
  if (credits <= 0 || !isCacheEnabled()) return;
  const sub = await getActiveSubscription(db, workspaceId);
  const { periodStart } = getCreditPeriodBounds(
    sub?.plan.limits,
    sub?.subscription,
  );
  await incrementCounterIfPresent(
    cacheKeys.creditsUsed(workspaceId, periodStart),
    credits,
  );
}

/** Overwrites the current period's counter with the Postgres total. */
export async function reseedCreditsUsed(
  db: Database,
  workspaceId: string,
): Promise<void> {
  if (!isCacheEnabled()) return;
  const sub = await getActiveSubscription(db, workspaceId);
  const period = getCreditPeriodBounds(sub?.plan.limits, sub?.subscription);
  const used = await getTotalCreditsByPeriod(
    db,
    workspaceId,
    period.periodStart,
    period.periodEnd,
  );
  await seedCounter(
    cacheKeys.creditsUsed(workspaceId, period.periodStart),
    used,
    CREDITS_USED_TTL_SECONDS,
    { overwrite: true },
  );
}

export function sumCredits(rows: readonly { credits: number }[]): number {
  return rows.reduce((sum, r) => sum + r.credits, 0);
}
