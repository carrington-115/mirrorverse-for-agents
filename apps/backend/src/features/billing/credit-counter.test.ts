import type { Database } from "@mirrorverse/db";
import type { Redis } from "@upstash/redis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@mirrorverse/env/backend", () => ({ env: { NODE_ENV: "test" } }));
vi.mock("./repo", () => ({
  getActiveSubscription: vi.fn(),
  getTotalCreditsByPeriod: vi.fn(),
}));

import { setCacheClient } from "../../lib/cache";
import {
  addCreditsUsed,
  CREDITS_USED_TTL_SECONDS,
  getCreditsUsed,
  reseedCreditsUsed,
  sumCredits,
} from "./credit-counter";
import { getActiveSubscription, getTotalCreditsByPeriod } from "./repo";

const db = {} as Database;
const period = {
  periodStart: new Date("2026-10-01T00:00:00.000Z"),
  periodEnd: new Date("2026-11-01T00:00:00.000Z"),
};
const key = `mv:v1:credits:ws1:${period.periodStart.getTime()}`;

function fakeRedis() {
  const store = new Map<string, number>();
  return {
    store,
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(
      async (k: string, v: number, opts: { ex: number; nx?: boolean }) => {
        if (opts.nx && store.has(k)) return null;
        store.set(k, v);
        return "OK";
      },
    ),
    eval: vi.fn(async (_script: string, keys: string[], args: string[]) => {
      const [k] = keys;
      if (!k || !store.has(k)) return null;
      store.set(k, (store.get(k) ?? 0) + Number(args[0]));
      return store.get(k);
    }),
  };
}

let redis: ReturnType<typeof fakeRedis>;

beforeEach(() => {
  vi.resetAllMocks();
  redis = fakeRedis();
  setCacheClient(redis as unknown as Redis);
  vi.mocked(getActiveSubscription).mockResolvedValue({
    plan: { limits: { creditsPeriod: "billing_period" } },
    subscription: {
      currentPeriodStart: period.periodStart,
      currentPeriodEnd: period.periodEnd,
    },
  } as unknown as Awaited<ReturnType<typeof getActiveSubscription>>);
});
afterEach(() => setCacheClient(null));

describe("getCreditsUsed", () => {
  it("computes from Postgres on a miss and seeds the counter", async () => {
    vi.mocked(getTotalCreditsByPeriod).mockResolvedValue(42);

    expect(await getCreditsUsed(db, "ws1", period)).toBe(42);
    expect(redis.set).toHaveBeenCalledWith(key, 42, {
      ex: CREDITS_USED_TTL_SECONDS,
      nx: true,
    });
  });

  it("serves a hit from Redis without querying Postgres", async () => {
    redis.store.set(key, 7);
    expect(await getCreditsUsed(db, "ws1", period)).toBe(7);
    expect(getTotalCreditsByPeriod).not.toHaveBeenCalled();
  });

  it("falls back to Postgres when Redis is down", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    setCacheClient({
      get: vi.fn().mockRejectedValue(new Error("down")),
      set: vi.fn().mockRejectedValue(new Error("down")),
    } as unknown as Redis);
    vi.mocked(getTotalCreditsByPeriod).mockResolvedValue(9);
    expect(await getCreditsUsed(db, "ws1", period)).toBe(9);
  });

  it("uses Postgres every time when Redis is not configured", async () => {
    setCacheClient(null);
    vi.mocked(getTotalCreditsByPeriod).mockResolvedValue(3);
    expect(await getCreditsUsed(db, "ws1", period)).toBe(3);
    expect(await getCreditsUsed(db, "ws1", period)).toBe(3);
    expect(getTotalCreditsByPeriod).toHaveBeenCalledTimes(2);
  });
});

describe("addCreditsUsed", () => {
  it("increments a seeded counter for the current period", async () => {
    redis.store.set(key, 10);
    await addCreditsUsed(db, "ws1", 5);
    expect(redis.store.get(key)).toBe(15);
  });

  it("leaves an unseeded counter missing", async () => {
    await addCreditsUsed(db, "ws1", 5);
    expect(redis.store.has(key)).toBe(false);
  });

  it("skips zero credits and an unconfigured cache", async () => {
    await addCreditsUsed(db, "ws1", 0);
    setCacheClient(null);
    await addCreditsUsed(db, "ws1", 5);
    expect(getActiveSubscription).not.toHaveBeenCalled();
  });
});

describe("reseedCreditsUsed", () => {
  it("overwrites a drifted counter with the Postgres total", async () => {
    redis.store.set(key, 999);
    vi.mocked(getTotalCreditsByPeriod).mockResolvedValue(120);
    await reseedCreditsUsed(db, "ws1");
    expect(redis.store.get(key)).toBe(120);
  });
});

describe("sumCredits", () => {
  it("sums inserted rows", () => {
    expect(sumCredits([])).toBe(0);
    expect(sumCredits([{ credits: 2 }, { credits: 3 }])).toBe(5);
  });
});
