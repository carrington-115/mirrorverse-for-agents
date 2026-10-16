import { Ratelimit, type Duration } from "@upstash/ratelimit";

import { getRedisClient } from "./cache";

// Sliding-window rate limits, one named bucket per entry point. Limits are
// deliberately generous: they exist to stop runaway loops and abuse, not to
// meter normal use (plan quotas do that). Without Redis every check allows.
export const RATE_LIMITS = {
  /** Chat stream starts, per user + workspace. */
  chat: { requests: 20, window: "1 m" },
  /** Inbound workflow webhooks, per endpoint slug. */
  webhook: { requests: 60, window: "1 m" },
  /** Vapi voice webhook calls, per assistant. */
  voiceWebhook: { requests: 120, window: "1 m" },
  /** Slack app mentions handled, per Slack team. */
  slackEvents: { requests: 30, window: "1 m" },
  /** Speech-to-text transcriptions (paid per call), per user. */
  speechTranscribe: { requests: 10, window: "1 m" },
  /** Auth-adjacent tRPC mutations (profile sync, onboarding), per user. */
  authMutation: { requests: 10, window: "1 m" },
} as const satisfies Record<string, { requests: number; window: Duration }>;

export type RateLimitName = keyof typeof RATE_LIMITS;

export type RateLimitResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly retryAfterSeconds: number };

export interface Limiter {
  limit(identifier: string): Promise<{ success: boolean; reset: number }>;
}

const limiters = new Map<RateLimitName, Limiter | null>();

function getLimiter(name: RateLimitName): Limiter | null {
  if (limiters.has(name)) return limiters.get(name) ?? null;
  const redis = getRedisClient();
  const { requests, window } = RATE_LIMITS[name];
  const limiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, window),
        prefix: `mv:v1:rl:${name}`,
      })
    : null;
  limiters.set(name, limiter);
  return limiter;
}

/** Test seam: install a limiter for one bucket (null = allow everything). */
export function setRateLimiter(name: RateLimitName, limiter: Limiter | null) {
  limiters.set(name, limiter);
}

/** Test seam: drop every installed limiter so they are rebuilt lazily. */
export function resetRateLimiters(): void {
  limiters.clear();
}

/** Checks one request against a bucket. Fails open if Redis errors. */
export async function checkRateLimit(
  name: RateLimitName,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name);
  if (!limiter) return { ok: true };
  try {
    const { success, reset } = await limiter.limit(identifier);
    if (success) return { ok: true };
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (err) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "rate limit check failed",
        name,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    return { ok: true };
  }
}

export function rateLimitedResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down." }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfterSeconds),
      },
    },
  );
}
