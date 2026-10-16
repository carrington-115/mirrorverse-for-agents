import type { Database } from "@mirrorverse/db";

import {
  cacheKeys,
  getCounter,
  incrementCounterIfPresent,
  isCacheEnabled,
  seedCounter,
} from "../../lib/cache";
import {
  countRunsThisPeriod,
  countRunsToday,
  getActiveSubscription,
} from "./repo";

// Plan run limits (maxRunsPerDay / maxRunsPerMonth), enforced through one
// check shared by every run entry point: manual, retry, webhook, cron and
// Slack. Counts come from a Redis counter seeded from workflow_runs; Postgres
// stays the source of truth and is used directly when Redis is unset.
//
// Runs are counted when their row is inserted (recordRunStarted), so a burst
// of dispatches that are still queued in Inngest can overshoot a limit by the
// number in flight, the same as before this helper existed.

// Short TTL so a missed increment heals by re-seeding, like the credit counter.
export const RUN_COUNTER_TTL_SECONDS = 15 * 60;

export type RunLimitResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly window: "day" | "month";
      readonly limit: number;
      readonly message: string;
    };

function startOfUtcDay(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function readCounter(
  key: string,
  load: () => Promise<number>,
): Promise<number> {
  const hit = await getCounter(key);
  if (hit !== null) return hit;
  const value = await load();
  await seedCounter(key, value, RUN_COUNTER_TTL_SECONDS);
  return value;
}

export async function getRunsToday(
  db: Database,
  workspaceId: string,
): Promise<number> {
  return readCounter(cacheKeys.runsDay(workspaceId, startOfUtcDay()), () =>
    countRunsToday(db, workspaceId),
  );
}

export async function getRunsThisPeriod(
  db: Database,
  workspaceId: string,
  periodStart: Date,
): Promise<number> {
  return readCounter(cacheKeys.runsPeriod(workspaceId, periodStart), () =>
    countRunsThisPeriod(db, workspaceId, periodStart),
  );
}

/** Whether the workspace may start another run under its plan's limits. */
export async function checkRunLimit(
  db: Database,
  workspaceId: string,
): Promise<RunLimitResult> {
  const sub = await getActiveSubscription(db, workspaceId);

  const dailyLimit = sub?.plan.limits.maxRunsPerDay ?? null;
  if (dailyLimit !== null) {
    const used = await getRunsToday(db, workspaceId);
    if (used >= dailyLimit) {
      return {
        ok: false,
        window: "day",
        limit: dailyLimit,
        message: "Daily run limit reached. Please upgrade your plan.",
      };
    }
  }

  const monthlyLimit = sub?.plan.limits.maxRunsPerMonth ?? null;
  if (monthlyLimit !== null) {
    const periodStart = sub?.subscription.currentPeriodStart ?? new Date(0);
    const used = await getRunsThisPeriod(db, workspaceId, periodStart);
    if (used >= monthlyLimit) {
      return {
        ok: false,
        window: "month",
        limit: monthlyLimit,
        message: "Monthly run limit reached. Please upgrade your plan.",
      };
    }
  }

  return { ok: true };
}

/** Bumps the seeded run counters after a workflow_runs row is inserted. */
export async function recordRunStarted(
  db: Database,
  workspaceId: string,
): Promise<void> {
  if (!isCacheEnabled()) return;
  const sub = await getActiveSubscription(db, workspaceId);
  const periodStart = sub?.subscription.currentPeriodStart ?? new Date(0);
  await Promise.all([
    incrementCounterIfPresent(
      cacheKeys.runsDay(workspaceId, startOfUtcDay()),
      1,
    ),
    incrementCounterIfPresent(
      cacheKeys.runsPeriod(workspaceId, periodStart),
      1,
    ),
  ]);
}
