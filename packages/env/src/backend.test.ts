import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FULL_ENV = {
  NODE_ENV: "test",
  PORT: "4000",
  API_VERSION: "v1",
  DATABASE_URL: "postgres://user:pw@localhost:5432/db",
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  JWT_SECRET: "secret",
  OPENAI_API_KEY: "key",
  ANTHROPIC_API_KEY: "key",
  ELEVENLABS_API_KEY: "key",
  TWILIO_ACCOUNT_SID: "sid",
  TWILIO_AUTH_TOKEN: "tok",
  TWILIO_PHONE_NUMBER: "+1",
  POSTHOG_API_KEY: "key",
};

describe("backend env", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it("parses all required vars and applies defaults", async () => {
    process.env = { ...FULL_ENV } as NodeJS.ProcessEnv;
    const { env } = await import("./backend");
    expect(env.NODE_ENV).toBe("test");
    expect(env.PORT).toBe(4000);
    expect(env.API_VERSION).toBe("v1");
    expect(env.POSTHOG_HOST).toBe("https://app.posthog.com");
    expect(env.JWT_EXPIRES_IN).toBe("7d");
    expect(env.CORS_ORIGIN).toBe("http://localhost:3000");
  });

  it("coerces PORT from string to number", async () => {
    process.env = { ...FULL_ENV, PORT: "8080" } as NodeJS.ProcessEnv;
    const { env } = await import("./backend");
    expect(env.PORT).toBe(8080);
    expect(typeof env.PORT).toBe("number");
  });

  it("throws when DATABASE_URL is missing", async () => {
    const { DATABASE_URL: _omit, ...rest } = FULL_ENV;
    process.env = rest as NodeJS.ProcessEnv;
    await expect(import("./backend")).rejects.toThrow();
  });

  it("skips validation when SKIP_ENV_VALIDATION is set", async () => {
    process.env = { SKIP_ENV_VALIDATION: "1" } as NodeJS.ProcessEnv;
    await expect(import("./backend")).resolves.toBeDefined();
  });
});
