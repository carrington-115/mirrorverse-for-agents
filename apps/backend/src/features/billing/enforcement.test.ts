import { describe, expect, it, vi } from "vitest";

// enforcement.ts imports from ./repo, which transitively pulls in
// @mirrorverse/db's env validation. Stub it out — these tests only exercise
// the pure helpers and checkCreditQuota against mocked reads.
vi.mock("./repo", () => ({
  getActiveSubscription: vi.fn(),
  getTotalCreditsByPeriod: vi.fn(),
}));
vi.mock("./promo-repo", () => ({
  settleBonusCredits: vi.fn(),
}));

import type { Database } from "@mirrorverse/db";

import {
  addPeriod,
  bonusOverage,
  checkCreditQuota,
  getCreditPeriodBounds,
  QuotaExceededError,
  remainingBonusCredits,
} from "./enforcement";
import { settleBonusCredits } from "./promo-repo";
import { getActiveSubscription, getTotalCreditsByPeriod } from "./repo";

describe("addPeriod", () => {
  it("advances a 'day' period by 24 hours", () => {
    const from = new Date("2026-06-12T00:00:00.000Z");
    const next = addPeriod("day", from);
    expect(next.getTime() - from.getTime()).toBe(86_400_000);
  });

  it("advances a 'billing_period' period by one calendar month", () => {
    const from = new Date(2026, 0, 15); // Jan 15, 2026 (local)
    const next = addPeriod("billing_period", from);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(1); // February
    expect(next.getDate()).toBe(15);
  });
});

describe("getCreditPeriodBounds", () => {
  it("returns today 00:00 UTC -> tomorrow 00:00 UTC for 'day' plans regardless of subscription dates", () => {
    const staleSubscription = {
      currentPeriodStart: new Date("2020-01-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2020-02-01T00:00:00.000Z"),
    };
    const { periodStart, periodEnd } = getCreditPeriodBounds(
      { creditsPeriod: "day" },
      staleSubscription,
    );
    expect(periodEnd.getTime() - periodStart.getTime()).toBe(86_400_000);
    expect(periodStart.getUTCHours()).toBe(0);
    expect(periodStart.getUTCMinutes()).toBe(0);
  });

  it("returns the subscription's current period for 'billing_period' plans", () => {
    const subscription = {
      currentPeriodStart: new Date("2026-06-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-07-01T00:00:00.000Z"),
    };
    const { periodStart, periodEnd } = getCreditPeriodBounds(
      { creditsPeriod: "billing_period" },
      subscription,
    );
    expect(periodStart).toEqual(subscription.currentPeriodStart);
    expect(periodEnd).toEqual(subscription.currentPeriodEnd);
  });
});

describe("bonusOverage", () => {
  it("is zero up to the 1.5x hard cap", () => {
    expect(bonusOverage(0, 200)).toBe(0);
    expect(bonusOverage(300, 200)).toBe(0);
  });

  it("is the usage beyond the hard cap", () => {
    expect(bonusOverage(450, 200)).toBe(150);
  });
});

describe("remainingBonusCredits", () => {
  it("subtracts consumed credits and current overage from the grant", () => {
    const pool = { grantedCredits: 1000, consumedCredits: 100 };
    expect(remainingBonusCredits(pool, 300, 200)).toBe(900);
    expect(remainingBonusCredits(pool, 500, 200)).toBe(700);
  });

  it("never goes below zero", () => {
    const pool = { grantedCredits: 1000, consumedCredits: 900 };
    expect(remainingBonusCredits(pool, 5000, 200)).toBe(0);
  });
});

describe("checkCreditQuota", () => {
  const db = {} as Database;
  const freePlan = {
    plan: { limits: { includedCredits: 200, creditsPeriod: "day" } },
    subscription: {
      currentPeriodStart: new Date("2026-10-15T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-10-16T00:00:00.000Z"),
    },
  };

  function mockState(
    used: number,
    pool: { grantedCredits: number; consumedCredits: number } | null,
  ) {
    vi.mocked(getActiveSubscription).mockResolvedValue(
      freePlan as unknown as Awaited<ReturnType<typeof getActiveSubscription>>,
    );
    vi.mocked(getTotalCreditsByPeriod).mockResolvedValue(used);
    vi.mocked(settleBonusCredits).mockResolvedValue(
      pool as unknown as Awaited<ReturnType<typeof settleBonusCredits>>,
    );
  }

  it("allows usage under the hard cap without bonus credits", async () => {
    mockState(299, null);
    await expect(checkCreditQuota(db, "ws")).resolves.toBeUndefined();
  });

  it("refuses usage at the hard cap without bonus credits", async () => {
    mockState(300, null);
    await expect(checkCreditQuota(db, "ws")).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
  });

  it("extends the hard cap by the unconsumed bonus credits", async () => {
    mockState(1299, { grantedCredits: 1000, consumedCredits: 0 });
    await expect(checkCreditQuota(db, "ws")).resolves.toBeUndefined();
  });

  it("refuses once the bonus credits are spent", async () => {
    mockState(800, { grantedCredits: 1000, consumedCredits: 500 });
    await expect(checkCreditQuota(db, "ws")).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
  });

  it("skips enforcement when the plan includes no credits", async () => {
    vi.mocked(getActiveSubscription).mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof getActiveSubscription>>,
    );
    await expect(checkCreditQuota(db, "ws")).resolves.toBeUndefined();
  });
});
