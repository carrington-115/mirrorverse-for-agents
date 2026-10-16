import { env } from "@mirrorverse/env/backend";
import { Redis } from "@upstash/redis";

// Thin Upstash Redis cache. Every operation fails open: if Redis is not
// configured, unreachable, or returns something unexpected, callers fall
// through to the source of truth (Postgres) instead of erroring.

let client: Redis | null | undefined;

function getClient(): Redis | null {
  if (client !== undefined) return client;
  // Tests never reach a real Redis, even with Upstash credentials in the
  // shell; they inject a fake through setCacheClient instead.
  client =
    env.NODE_ENV !== "test" &&
    env.UPSTASH_REDIS_REST_URL &&
    env.UPSTASH_REDIS_REST_TOKEN
      ? new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        })
      : null;
  return client;
}

/** Test seam: swap or clear the Redis client. */
export function setCacheClient(next: Redis | null): void {
  client = next;
}

export function isCacheEnabled(): boolean {
  return getClient() !== null;
}

// Bump to invalidate every cached entry after a payload-shape change.
const KEY_PREFIX = "mv:v1:";

export const cacheKeys = {
  activeSubscription: (workspaceId: string) => `sub:${workspaceId}`,
  creditsUsed: (workspaceId: string, periodStart: Date) =>
    `credits:${workspaceId}:${periodStart.getTime()}`,
} as const;

function warn(op: string, key: string, err: unknown): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      msg: "cache operation failed",
      op,
      key,
      error: err instanceof Error ? err.message : String(err),
    }),
  );
}

// JSON turns Date into an ISO string. Restore the timestamp-shaped fields
// (createdAt, currentPeriodEnd, trialEndsAt, ...) so cached rows match what
// Drizzle returns.
const DATE_KEY = /(At|Start|End)$/;
const ISO_DATE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function revive<T>(value: T): T {
  if (Array.isArray(value)) return value.map(revive) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] =
        typeof v === "string" && DATE_KEY.test(k) && ISO_DATE.test(v)
          ? new Date(v)
          : revive(v);
    }
    return out as T;
  }
  return value;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get<T>(KEY_PREFIX + key);
    return raw === null || raw === undefined ? null : revive(raw);
  } catch (err) {
    warn("get", key, err);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(KEY_PREFIX + key, JSON.stringify(value), {
      ex: ttlSeconds,
    });
  } catch (err) {
    warn("set", key, err);
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const redis = getClient();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys.map((k) => KEY_PREFIX + k));
  } catch (err) {
    warn("del", keys.join(","), err);
  }
}

/**
 * Read-through cache. `null` results are not cached so a missing row (e.g. a
 * workspace that has no subscription yet) is picked up as soon as it exists.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T | null>,
): Promise<T | null> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await load();
  if (value !== null) await cacheSet(key, value, ttlSeconds);
  return value;
}

// ─── Counters ─────────────────────────────────────────────────────────────────
// Integer counters stored as plain Redis strings. Like the cache ops above they
// fail open: `null` means "no answer from Redis", and callers fall back to
// Postgres.

function toCount(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  return raw === null || raw === undefined || !Number.isFinite(n) ? null : n;
}

export async function getCounter(key: string): Promise<number | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    return toCount(await redis.get<number | string>(KEY_PREFIX + key));
  } catch (err) {
    warn("get", key, err);
    return null;
  }
}

/**
 * INCRBY + EXPIRE in one round trip, creating the counter at 0 if missing.
 * Returns the new value. Use for counters that start empty (e.g. rate-limit
 * style tallies), not for ones that must be seeded from Postgres first.
 */
export async function cacheIncrBy(
  key: string,
  amount: number,
  ttlSeconds: number,
): Promise<number | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    const [value] = await redis
      .pipeline()
      .incrby(KEY_PREFIX + key, amount)
      .expire(KEY_PREFIX + key, ttlSeconds)
      .exec<[number, number]>();
    return toCount(value);
  } catch (err) {
    warn("incrby", key, err);
    return null;
  }
}

// Increments only an existing counter, so a counter that was never seeded (or
// has expired) stays missing and the next read re-seeds it from Postgres
// rather than starting from an undercounted 0.
const INCR_IF_EXISTS = `if redis.call("EXISTS", KEYS[1]) == 1 then return redis.call("INCRBY", KEYS[1], ARGV[1]) end return nil`;

export async function incrementCounterIfPresent(
  key: string,
  amount: number,
): Promise<number | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    return toCount(
      await redis.eval(INCR_IF_EXISTS, [KEY_PREFIX + key], [String(amount)]),
    );
  } catch (err) {
    warn("incrby", key, err);
    return null;
  }
}

/**
 * Seeds a counter with a value computed from Postgres. With `overwrite: false`
 * (the default) an existing counter is left alone, so a seed computed before a
 * concurrent increment can't roll the counter back.
 */
export async function seedCounter(
  key: string,
  value: number,
  ttlSeconds: number,
  { overwrite = false }: { overwrite?: boolean } = {},
): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    await (overwrite
      ? redis.set(KEY_PREFIX + key, value, { ex: ttlSeconds })
      : redis.set(KEY_PREFIX + key, value, { ex: ttlSeconds, nx: true }));
  } catch (err) {
    warn("set", key, err);
  }
}
