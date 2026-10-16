import type { Database } from "@mirrorverse/db";
import type { Redis } from "@upstash/redis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@mirrorverse/env/backend", () => ({ env: { NODE_ENV: "test" } }));
vi.mock("./repo", () => ({
  countRunsThisPeriod: vi.fn(),
  countRunsToday: vi.fn(),
  getActiveSubscription: vi.fn(),
}));

import { setCacheClient } from "../../lib/cache";
import { checkRunLimit, getRunsToday, recordRunStarted } from "./run-limits";
import {
  countRunsThisPeriod,
  countRunsToday,
  getActiveSubscription,
} from "./repo";

const db = {} as Database;
const periodStart = new Date("2026-10-01T00:00:00.000Z");

function mockPlan(limits: {
  maxRunsPerDay: number | null;
  maxRunsPerMonth: number | null;
}) {
  vi.mocked(getActiveSubscription).mockResolvedValue({
    plan: { limits },
    subscription: { currentPeriodStart: periodStart },
  } as unknown as Awaited<ReturnType<typeof getActiveSubscription>>);
}

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

beforeEach(() => vi.resetAllMocks());
afterEach(() => setCacheClient(null));

describe("checkRunLimit (Postgres only)", () => {
  it("allows runs when the plan has no run limits", async () => {
    mockPlan({ maxRunsPerDay: null, maxRunsPerMonth: null });
    expect(await checkRunLimit(db, "ws1")).toEqual({ ok: true });
    expect(countRunsToday).not.toHaveBeenCalled();
  });

  it("refuses once the daily limit is reached", async () => {
    mockPlan({ maxRunsPerDay: 5, maxRunsPerMonth: null });
    vi.mocked(countRunsToday).mockResolvedValue(5);
    expect(await checkRunLimit(db, "ws1")).toMatchObject({
      ok: false,
      window: "day",
      limit: 5,
    });
  });

  it("refuses once the monthly limit is reached", async () => {
    mockPlan({ maxRunsPerDay: 100, maxRunsPerMonth: 20 });
    vi.mocked(countRunsToday).mockResolvedValue(3);
    vi.mocked(countRunsThisPeriod).mockResolvedValue(20);
    expect(await checkRunLimit(db, "ws1")).toMatchObject({
      ok: false,
      window: "month",
      limit: 20,
    });
    expect(countRunsThisPeriod).toHaveBeenCalledWith(db, "ws1", periodStart);
  });

  it("allows runs under both limits", async () => {
    mockPlan({ maxRunsPerDay: 10, maxRunsPerMonth: 100 });
    vi.mocked(countRunsToday).mockResolvedValue(9);
    vi.mocked(countRunsThisPeriod).mockResolvedValue(99);
    expect(await checkRunLimit(db, "ws1")).toEqual({ ok: true });
  });
});

describe("run counters (Redis)", () => {
  it("seeds from Postgres once, then serves from Redis", async () => {
    setCacheClient(fakeRedis() as unknown as Redis);
    vi.mocked(countRunsToday).mockResolvedValue(4);
    expect(await getRunsToday(db, "ws1")).toBe(4);
    expect(await getRunsToday(db, "ws1")).toBe(4);
    expect(countRunsToday).toHaveBeenCalledTimes(1);
  });

  it("counts started runs on top of the seeded value", async () => {
    setCacheClient(fakeRedis() as unknown as Redis);
    mockPlan({ maxRunsPerDay: 5, maxRunsPerMonth: null });
    vi.mocked(countRunsToday).mockResolvedValue(4);

    expect((await checkRunLimit(db, "ws1")).ok).toBe(true);
    await recordRunStarted(db, "ws1");
    expect((await checkRunLimit(db, "ws1")).ok).toBe(false);
    expect(countRunsToday).toHaveBeenCalledTimes(1);
  });

  it("does nothing on recordRunStarted without Redis", async () => {
    await recordRunStarted(db, "ws1");
    expect(getActiveSubscription).not.toHaveBeenCalled();
  });
});
