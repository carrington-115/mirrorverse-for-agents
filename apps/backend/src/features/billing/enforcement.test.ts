import { describe, expect, it, vi } from "vitest";

// enforcement.ts imports from ./repo, which transitively pulls in
// @mirrorverse/db's env validation. Stub it out — these tests only exercise
// the pure period-math helpers.
vi.mock("./repo", () => ({
  getActiveSubscription: vi.fn(),
  getTotalCreditsByPeriod: vi.fn(),
}));

import { addPeriod, getCreditPeriodBounds } from "./enforcement";

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
