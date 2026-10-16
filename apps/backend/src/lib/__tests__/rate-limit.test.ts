import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@mirrorverse/env/backend", () => ({ env: { NODE_ENV: "test" } }));

import {
  checkRateLimit,
  rateLimitedResponse,
  resetRateLimiters,
  setRateLimiter,
  type Limiter,
} from "../rate-limit";

function fakeLimiter(
  allowed: number,
  resetInMs = 30_000,
): Limiter & {
  calls: string[];
} {
  const counts = new Map<string, number>();
  const calls: string[] = [];
  return {
    calls,
    limit: async (id: string) => {
      calls.push(id);
      const n = (counts.get(id) ?? 0) + 1;
      counts.set(id, n);
      return { success: n <= allowed, reset: Date.now() + resetInMs };
    },
  };
}

afterEach(() => resetRateLimiters());

describe("checkRateLimit", () => {
  it("allows everything when Redis is not configured", async () => {
    for (let i = 0; i < 50; i++) {
      expect(await checkRateLimit("chat", "u1")).toEqual({ ok: true });
    }
  });

  it("refuses once the bucket is full and reports when to retry", async () => {
    setRateLimiter("chat", fakeLimiter(2, 12_500));
    expect((await checkRateLimit("chat", "u1")).ok).toBe(true);
    expect((await checkRateLimit("chat", "u1")).ok).toBe(true);
    expect(await checkRateLimit("chat", "u1")).toEqual({
      ok: false,
      retryAfterSeconds: 13,
    });
  });

  it("tracks identifiers and buckets separately", async () => {
    const chat = fakeLimiter(1);
    setRateLimiter("chat", chat);
    setRateLimiter("webhook", fakeLimiter(1));
    expect((await checkRateLimit("chat", "u1")).ok).toBe(true);
    expect((await checkRateLimit("chat", "u2")).ok).toBe(true);
    expect((await checkRateLimit("webhook", "u1")).ok).toBe(true);
    expect(chat.calls).toEqual(["u1", "u2"]);
  });

  it("never reports a retry-after below one second", async () => {
    setRateLimiter("chat", fakeLimiter(0, -5_000));
    expect(await checkRateLimit("chat", "u1")).toEqual({
      ok: false,
      retryAfterSeconds: 1,
    });
  });

  it("fails open when the limiter throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    setRateLimiter("chat", {
      limit: vi.fn().mockRejectedValue(new Error("down")),
    });
    expect(await checkRateLimit("chat", "u1")).toEqual({ ok: true });
  });
});

describe("rateLimitedResponse", () => {
  it("is a 429 with Retry-After", async () => {
    const res = rateLimitedResponse(7);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("7");
    expect(await res.json()).toEqual({
      error: "Too many requests. Please slow down.",
    });
  });
});
