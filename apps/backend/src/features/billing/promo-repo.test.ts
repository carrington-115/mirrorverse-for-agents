import { describe, expect, it, vi } from "vitest";

// Stub the db package (its client validates env at import). Tables expose any
// column name; query helpers are inert because fakeDb ignores the predicates.
vi.mock("@mirrorverse/db", () => {
  const table = new Proxy({}, { get: (_t, column) => column });
  const helper = () => ({});
  return {
    schema: new Proxy({}, { get: () => table }),
    and: helper,
    desc: helper,
    eq: helper,
    isNull: helper,
    lt: helper,
    or: helper,
    sql: helper,
  };
});
vi.mock("./repo", () => ({
  getTotalCreditsByPeriod: vi.fn(),
}));

import type { Database } from "@mirrorverse/db";

import { normalizeEmail, PromoCodeError, redeemPromoCode } from "./promo-repo";

// Minimal stand-in for drizzle's select builder: each `.limit()` resolves to
// the next queued result.
function fakeDb(results: unknown[][]): Database {
  const queue = [...results];
  const chain = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve(queue.shift() ?? []),
  };
  return chain as unknown as Database;
}

const period = {
  periodStart: new Date("2026-10-16T00:00:00.000Z"),
  periodEnd: new Date("2026-10-17T00:00:00.000Z"),
};

const restrictedPromo = {
  id: "promo-1",
  code: "HACKTOBERFEST-26",
  valueCents: 500,
  startsAt: new Date("2026-10-01T00:00:00.000Z"),
  expiresAt: new Date("2099-01-01T00:00:00.000Z"),
  maxRedemptions: null,
  redemptionCount: 0,
  isActive: true,
  restrictToAllowlist: true,
};

function redeem(db: Database, email: string) {
  return redeemPromoCode(db, {
    workspaceId: "ws-1",
    userId: "user-1",
    email,
    code: "hacktoberfest-26",
    includedCredits: 200,
    period,
  });
}

async function rejectionReason(promise: Promise<unknown>) {
  const err = await promise.catch((e: unknown) => e);
  expect(err).toBeInstanceOf(PromoCodeError);
  return (err as PromoCodeError).reason;
}

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Someone@Example.COM ")).toBe(
      "someone@example.com",
    );
  });
});

describe("redeemPromoCode allowlist", () => {
  it("rejects an email that is not on the allowlist", async () => {
    const db = fakeDb([[restrictedPromo], []]);
    expect(await rejectionReason(redeem(db, "stranger@example.com"))).toBe(
      "not_eligible",
    );
  });

  it("lets an allowlisted email through to the redemption checks", async () => {
    // Allowlist hit, then an existing redemption for this workspace.
    const db = fakeDb([
      [restrictedPromo],
      [{ email: "a@example.com" }],
      [{ id: "r-1" }],
    ]);
    expect(await rejectionReason(redeem(db, " A@Example.com"))).toBe(
      "already_redeemed",
    );
  });

  it("skips the allowlist for unrestricted codes", async () => {
    const db = fakeDb([
      [{ ...restrictedPromo, restrictToAllowlist: false }],
      [{ id: "r-1" }],
    ]);
    expect(await rejectionReason(redeem(db, "anyone@example.com"))).toBe(
      "already_redeemed",
    );
  });
});
