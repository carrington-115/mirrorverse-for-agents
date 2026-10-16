import type { Database } from "@mirrorverse/db";
import type { Redis } from "@upstash/redis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@mirrorverse/env/backend", () => ({ env: { NODE_ENV: "test" } }));
vi.mock("@mirrorverse/db", () => ({
  schema: {
    subscriptions: {
      id: "id",
      workspaceId: "workspace_id",
      planId: "plan_id",
      status: "status",
      stripeSubscriptionId: "stripe_subscription_id",
    },
    plans: { id: "id" },
  },
  and: vi.fn(),
  asc: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  sql: vi.fn(),
}));
vi.mock("@mirrorverse/agent", () => ({ centsToCredits: vi.fn() }));
vi.mock("./enforcement", () => ({ addPeriod: vi.fn() }));
vi.mock("./stripe-client", () => ({ stripe: {} }));

import { setCacheClient } from "../../lib/cache";
import {
  getActiveSubscription,
  getActiveSubscriptionUncached,
  getFreePlan,
  renewSubscriptionPeriod,
  upsertSubscription,
} from "./repo";

const row = {
  subscription: {
    id: "sub_row",
    workspaceId: "ws1",
    stripeSubscriptionId: "sub_123",
    stripeCustomerId: "cus_123",
    defaultPaymentMethod: "pm_123",
    planId: "pro",
    status: "active",
    currentPeriodStart: new Date("2026-10-01T00:00:00.000Z"),
    currentPeriodEnd: new Date("2026-11-01T00:00:00.000Z"),
    trialEndsAt: null,
  },
  plan: { id: "pro", limits: { includedCredits: 1000 } },
};

function fakeDb() {
  const limit = vi.fn(async () => [row]);
  const returning = vi.fn(async () => [{ workspaceId: "ws1" }]);
  const onConflictDoUpdate = vi.fn(async () => undefined);
  const db = {
    select: vi.fn(() => ({
      from: () => ({ innerJoin: () => ({ where: () => ({ limit }) }) }),
    })),
    update: vi.fn(() => ({
      set: () => ({ where: () => ({ returning }) }),
    })),
    insert: vi.fn(() => ({ values: () => ({ onConflictDoUpdate }) })),
  };
  return { db: db as unknown as Database, limit };
}

function fakeRedis() {
  const store = new Map<string, string>();
  return {
    store,
    get: vi.fn(async (k: string) => {
      const v = store.get(k);
      return v === undefined ? null : JSON.parse(v);
    }),
    set: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
      return "OK";
    }),
    del: vi.fn(async (...ks: string[]) => {
      ks.forEach((k) => store.delete(k));
      return ks.length;
    }),
  };
}

let redis: ReturnType<typeof fakeRedis>;

beforeEach(() => {
  redis = fakeRedis();
  setCacheClient(redis as unknown as Redis);
});
afterEach(() => setCacheClient(null));

describe("getActiveSubscription", () => {
  it("serves repeat reads from the cache without touching the db", async () => {
    const { db, limit } = fakeDb();
    const first = await getActiveSubscription(db, "ws1");
    const second = await getActiveSubscription(db, "ws1");

    expect(limit).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(second?.subscription.currentPeriodEnd).toBeInstanceOf(Date);
  });

  it("keeps Stripe ids and the payment method out of the cache", async () => {
    const { db } = fakeDb();
    const result = await getActiveSubscription(db, "ws1");
    const stored = redis.store.get("mv:v1:sub:ws1") ?? "";

    expect(stored).not.toMatch(/cus_123|sub_123|pm_123/);
    expect(result?.subscription).not.toHaveProperty("stripeCustomerId");
    expect(result?.subscription).not.toHaveProperty("defaultPaymentMethod");
    expect(result?.subscription).not.toHaveProperty("stripeSubscriptionId");
  });

  it("returns the full row from the uncached read", async () => {
    const { db } = fakeDb();
    const result = await getActiveSubscriptionUncached(db, "ws1");
    expect(result?.subscription.stripeCustomerId).toBe("cus_123");
  });

  it("is invalidated by renewSubscriptionPeriod", async () => {
    const { db, limit } = fakeDb();
    await getActiveSubscription(db, "ws1");
    await renewSubscriptionPeriod(db, "sub_row", new Date(), new Date());
    await getActiveSubscription(db, "ws1");

    expect(redis.del).toHaveBeenCalledWith("mv:v1:sub:ws1");
    expect(limit).toHaveBeenCalledTimes(2);
  });

  it("is invalidated by upsertSubscription", async () => {
    const { db, limit } = fakeDb();
    await getActiveSubscription(db, "ws1");
    await upsertSubscription(db, {
      workspaceId: "ws1",
      stripeSubscriptionId: "sub_123",
      stripeCustomerId: "cus_123",
      planId: "pro",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      defaultPaymentMethod: null,
    });
    await getActiveSubscription(db, "ws1");

    expect(redis.del).toHaveBeenCalledWith("mv:v1:sub:ws1");
    expect(limit).toHaveBeenCalledTimes(2);
  });
});

describe("getFreePlan", () => {
  it("caches the free plan row", async () => {
    const limit = vi.fn(async () => [{ id: "free", createdAt: new Date() }]);
    const db = {
      select: () => ({ from: () => ({ where: () => ({ limit }) }) }),
    } as unknown as Database;

    await getFreePlan(db);
    const plan = await getFreePlan(db);

    expect(limit).toHaveBeenCalledTimes(1);
    expect(plan?.id).toBe("free");
    expect(plan?.createdAt).toBeInstanceOf(Date);
  });
});
