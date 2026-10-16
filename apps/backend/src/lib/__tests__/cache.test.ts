import type { Redis } from "@upstash/redis";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cacheDel,
  cacheGet,
  cacheIncrBy,
  cacheSet,
  cached,
  getCounter,
  incrementCounterIfPresent,
  isCacheEnabled,
  seedCounter,
  setCacheClient,
} from "../cache";

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

vi.mock("@mirrorverse/env/backend", () => ({
  // Real-looking credentials: the NODE_ENV guard must still keep tests offline.
  env: {
    NODE_ENV: "test",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "token",
  },
}));

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

describe("test-environment guard", () => {
  it("never builds a real client under NODE_ENV=test", () => {
    // Clear the client so the lazy initializer runs again.
    setCacheClient(undefined as unknown as null);
    expect(isCacheEnabled()).toBe(false);
  });
});

function fakeCounterRedis() {
  const store = new Map<string, number>();
  const ttls = new Map<string, number>();
  const pipeline = () => {
    const ops: (() => unknown)[] = [];
    const p = {
      incrby: (k: string, n: number) => {
        ops.push(() => {
          store.set(k, (store.get(k) ?? 0) + n);
          return store.get(k);
        });
        return p;
      },
      expire: (k: string, ttl: number) => {
        ops.push(() => {
          ttls.set(k, ttl);
          return 1;
        });
        return p;
      },
      exec: async () => ops.map((op) => op()),
    };
    return p;
  };
  return {
    store,
    ttls,
    pipeline,
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(
      async (
        k: string,
        v: number,
        opts: { ex: number; nx?: boolean },
      ): Promise<"OK" | null> => {
        if (opts.nx && store.has(k)) return null;
        store.set(k, v);
        ttls.set(k, opts.ex);
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

describe("counters", () => {
  it("increments and sets a TTL in one pipeline", async () => {
    const redis = fakeCounterRedis();
    setCacheClient(redis as unknown as Redis);
    expect(await cacheIncrBy("c", 2, 30)).toBe(2);
    expect(await cacheIncrBy("c", 3, 30)).toBe(5);
    expect(redis.ttls.get("mv:v1:c")).toBe(30);
    expect(await getCounter("c")).toBe(5);
  });

  it("reports a missing counter as null", async () => {
    setCacheClient(fakeCounterRedis() as unknown as Redis);
    expect(await getCounter("missing")).toBeNull();
  });

  it("only increments counters that were seeded", async () => {
    setCacheClient(fakeCounterRedis() as unknown as Redis);
    expect(await incrementCounterIfPresent("c", 5)).toBeNull();
    expect(await getCounter("c")).toBeNull();

    await seedCounter("c", 10, 60);
    expect(await incrementCounterIfPresent("c", 5)).toBe(15);
  });

  it("does not let a seed overwrite a live counter unless asked", async () => {
    setCacheClient(fakeCounterRedis() as unknown as Redis);
    await seedCounter("c", 10, 60);
    await seedCounter("c", 3, 60);
    expect(await getCounter("c")).toBe(10);
    await seedCounter("c", 3, 60, { overwrite: true });
    expect(await getCounter("c")).toBe(3);
  });

  it("fails open when Redis throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const down = vi.fn().mockRejectedValue(new Error("down"));
    const pipeline = {
      incrby: () => pipeline,
      expire: () => pipeline,
      exec: down,
    };
    setCacheClient({
      get: down,
      set: down,
      eval: down,
      pipeline: () => pipeline,
    } as unknown as Redis);
    expect(await getCounter("c")).toBeNull();
    expect(await cacheIncrBy("c", 1, 10)).toBeNull();
    expect(await incrementCounterIfPresent("c", 1)).toBeNull();
    await expect(seedCounter("c", 1, 10)).resolves.toBeUndefined();
  });
});
