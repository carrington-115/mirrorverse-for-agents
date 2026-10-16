import type { Redis } from "@upstash/redis";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cacheDel, cacheGet, cacheSet, cached, setCacheClient } from "../cache";

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

vi.mock("@mirrorverse/env/backend", () => ({ env: {} }));

afterEach(() => setCacheClient(null));

describe("cache", () => {
  it("is a no-op without a client", async () => {
    setCacheClient(null);
    await cacheSet("a", { x: 1 }, 10);
    expect(await cacheGet("a")).toBeNull();
    const load = vi.fn(async () => 5);
    expect(await cached("a", 10, load)).toBe(5);
    expect(await cached("a", 10, load)).toBe(5);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("serves the second read from cache and restores dates", async () => {
    const redis = fakeRedis();
    setCacheClient(redis as unknown as Redis);
    const periodEnd = new Date("2026-11-01T00:00:00.000Z");
    const load = vi.fn(async () => ({
      subscription: { currentPeriodEnd: periodEnd, trialEndsAt: null },
      plan: { id: "pro", limits: { creditsPeriod: "day" } },
    }));

    await cached("sub:1", 60, load);
    const hit = await cached("sub:1", 60, load);

    expect(load).toHaveBeenCalledTimes(1);
    expect(hit?.subscription.currentPeriodEnd).toBeInstanceOf(Date);
    expect(hit?.subscription.currentPeriodEnd.getTime()).toBe(
      periodEnd.getTime(),
    );
    expect(hit?.subscription.trialEndsAt).toBeNull();
    expect(redis.set).toHaveBeenCalledWith("mv:v1:sub:1", expect.any(String), {
      ex: 60,
    });
  });

  it("does not cache null results", async () => {
    setCacheClient(fakeRedis() as unknown as Redis);
    const load = vi.fn(async () => null);
    await cached("sub:2", 60, load);
    await cached("sub:2", 60, load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("invalidates with cacheDel", async () => {
    const redis = fakeRedis();
    setCacheClient(redis as unknown as Redis);
    await cacheSet("k", { a: 1 }, 10);
    expect(await cacheGet("k")).toEqual({ a: 1 });
    await cacheDel("k");
    expect(await cacheGet("k")).toBeNull();
  });

  it("fails open when Redis throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    setCacheClient({
      get: vi.fn().mockRejectedValue(new Error("down")),
      set: vi.fn().mockRejectedValue(new Error("down")),
      del: vi.fn().mockRejectedValue(new Error("down")),
    } as unknown as Redis);
    const load = vi.fn(async () => "db");
    expect(await cached("k", 10, load)).toBe("db");
    await expect(cacheDel("k")).resolves.toBeUndefined();
  });
});
