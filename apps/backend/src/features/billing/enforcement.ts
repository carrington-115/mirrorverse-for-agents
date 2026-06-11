import type { Database } from "@mirrorverse/db";
import type { QuotaCheck, UsageKind } from "@mirrorverse/types";

import { getActiveSubscription, getTotalCreditsByPeriod } from "./repo";

// Maps UsageKind values to the PlanLimits field that caps them via Redis quota.
// Intentionally absent:
//   embedding, composio_action — gated by the credit umbrella (checkCreditQuota sums all kinds)
//   phone_number_month         — enforced by countPhoneNumbers capacity check (maxPhoneNumbers)
//   storage_gb_month           — not yet enforced; TODO add maxStorageGb to PlanLimits + upload route check
const KIND_TO_LIMIT_FIELD: Partial<
  Record<UsageKind, keyof import("@mirrorverse/types").PlanLimits>
> = {
  llm_input: "includedTokens",
  llm_output: "includedTokens",
  llm_input_cache_read: "includedTokens",
  llm_input_cache_write: "includedTokens",
  voice_minute: "includedVoiceMinutes",
  sandbox_second: "includedSandboxSeconds",
};

export class QuotaExceededError extends Error {
  constructor(
    public readonly kind: UsageKind,
    public readonly used: number,
    public readonly limit: number,
  ) {
    super(`Quota exceeded for ${kind}: ${used}/${limit}`);
    this.name = "QuotaExceededError";
  }
}

interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<unknown>;
  incr(key: string): Promise<number>;
  expireat(key: string, timestamp: number): Promise<unknown>;
}

// In-memory fallback when Redis is unavailable (no enforcement in dev without Redis)
class NoopRedis implements RedisLike {
  private store = new Map<string, number>();
  async get(key: string) {
    return String(this.store.get(key) ?? 0);
  }
  async set(_key: string, _value: string) {
    return "OK";
  }
  async incr(key: string) {
    const v = (this.store.get(key) ?? 0) + 1;
    this.store.set(key, v);
    return v;
  }
  async expireat() {
    return 1;
  }
}

let _redis: RedisLike | null = null;

async function getRedis(): Promise<RedisLike> {
  if (_redis) return _redis;
  try {
    const { env } = await import("@mirrorverse/env/backend");
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      _redis = new NoopRedis();
      return _redis;
    }
    // Dynamically import @upstash/redis — only required when the Upstash REST
    // credentials are set. Falls back to NoopRedis if the package is not installed.
    type RedisConstructor = new (opts: {
      url: string;
      token: string;
    }) => RedisLike;
    const mod = (await import(
      /* turbopackIgnore: true */ /* webpackIgnore: true */ "@upstash/redis" as string
    )) as {
      Redis: RedisConstructor;
    };
    _redis = new mod.Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch {
    _redis = new NoopRedis();
  }
  return _redis as RedisLike;
}

// Plan limits are cached per workspace for 5 minutes to avoid a DB hit per LLM call
const planLimitCache = new Map<
  string,
  { limit: number | null; periodEnd: Date; cachedAt: number }
>();
const PLAN_CACHE_TTL_MS = 5 * 60 * 1000;

async function getPlanLimit(
  db: Database,
  workspaceId: string,
  kind: UsageKind,
): Promise<{ limit: number | null; periodEnd: Date }> {
  const cached = planLimitCache.get(`${workspaceId}:${kind}`);
  if (cached && Date.now() - cached.cachedAt < PLAN_CACHE_TTL_MS) {
    return { limit: cached.limit, periodEnd: cached.periodEnd };
  }

  const row = await getActiveSubscription(db, workspaceId);
  const periodEnd =
    row?.subscription.currentPeriodEnd ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const limitField = KIND_TO_LIMIT_FIELD[kind];
  let limit: number | null = null;
  if (limitField && row?.plan.limits) {
    const raw = row.plan.limits[limitField];
    limit = typeof raw === "number" ? raw : null;
  }

  planLimitCache.set(`${workspaceId}:${kind}`, {
    limit,
    periodEnd,
    cachedAt: Date.now(),
  });
  return { limit, periodEnd };
}

export async function checkQuota(
  db: Database,
  workspaceId: string,
  kind: UsageKind,
): Promise<QuotaCheck> {
  const { limit, periodEnd } = await getPlanLimit(db, workspaceId, kind);

  // No limit configured → always allow
  if (limit === null) {
    return {
      kind,
      used: 0,
      limit: null,
      remaining: null,
      periodEnd,
      hardCap: false,
    };
  }

  const redis = await getRedis();
  const key = `billing:quota:${workspaceId}:${kind}:${periodEnd.getTime()}`;

  const raw = await redis.get(key);
  const used = parseInt(raw ?? "0", 10);
  const ratio = used / limit;

  if (ratio >= 1.5) {
    throw new QuotaExceededError(kind, used, limit);
  }

  const remaining = Math.max(0, limit - used);
  return { kind, used, limit, remaining, periodEnd, hardCap: ratio >= 1.0 };
}

export async function checkCreditQuota(
  db: Database,
  workspaceId: string,
): Promise<void> {
  const row = await getActiveSubscription(db, workspaceId);
  const includedCredits = row?.plan.limits.includedCredits ?? null;
  if (!includedCredits) return;

  const periodStart = row?.subscription.currentPeriodStart ?? new Date(0);
  const periodEnd =
    row?.subscription.currentPeriodEnd ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const usedCredits = await getTotalCreditsByPeriod(
    db,
    workspaceId,
    periodStart,
    periodEnd,
  );
  const ratio = usedCredits / includedCredits;

  if (ratio >= 1.5) {
    throw new QuotaExceededError("llm_input", usedCredits, includedCredits);
  }
}

export async function incrementQuota(
  workspaceId: string,
  kind: UsageKind,
  periodEnd: Date,
  amount = 1,
): Promise<void> {
  try {
    const redis = await getRedis();
    const key = `billing:quota:${workspaceId}:${kind}:${periodEnd.getTime()}`;
    for (let i = 0; i < amount; i++) {
      await redis.incr(key);
    }
    await redis.expireat(key, Math.floor(periodEnd.getTime() / 1000) + 86400);
  } catch {
    // Non-fatal: quota increment failure should not block LLM calls
  }
}
