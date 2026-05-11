import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3001),
    API_VERSION: z.string().default("v1"),

    DATABASE_URL: z.string().url(),

    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default("7d"),

    REDIS_URL: z.string().url().optional(),
    REDIS_PASSWORD: z.string().optional(),

    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    ELEVENLABS_API_KEY: z.string().min(1).optional(),

    TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    TWILIO_PHONE_NUMBER: z.string().min(1).optional(),
    TWILIO_WHATSAPP_NUMBER: z.string().min(1).optional(),

    SENTRY_DSN: z.url().optional(),
    POSTHOG_API_KEY: z.string().min(1).optional(),
    POSTHOG_HOST: z.url().default("https://app.posthog.com"),

    CORS_ORIGIN: z.string().default("http://localhost:3000"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
