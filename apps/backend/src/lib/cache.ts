import { env } from "@mirrorverse/env/backend";
import { Redis } from "@upstash/redis";

// Thin Upstash Redis cache. Every operation fails open: if Redis is not
// configured, unreachable, or returns something unexpected, callers fall
// through to the source of truth (Postgres) instead of erroring.

let client: Redis | null | undefined;

function getClient(): Redis | null {
  if (client !== undefined) return client;
  client =
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
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
