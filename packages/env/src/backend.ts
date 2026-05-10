import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3001),
    API_VERSION: z.string().default("v1"),

    DATABASE_URL: z.string().url(),

    REDIS_URL: z.string().url(),
    REDIS_PASSWORD: z.string().optional(),

    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default("7d"),

    OPENAI_API_KEY: z.string().min(1),
    ANTHROPIC_API_KEY: z.string().min(1),
    ELEVENLABS_API_KEY: z.string().min(1),

    TWILIO_ACCOUNT_SID: z.string().min(1),
    TWILIO_AUTH_TOKEN: z.string().min(1),
    TWILIO_PHONE_NUMBER: z.string().min(1),
    TWILIO_WHATSAPP_NUMBER: z.string().min(1),

    SENTRY_DSN: z.string().url().optional(),
    POSTHOG_API_KEY: z.string().min(1),
    POSTHOG_HOST: z.string().url().default("https://app.posthog.com"),

    CORS_ORIGIN: z.string().default("http://localhost:3000"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
