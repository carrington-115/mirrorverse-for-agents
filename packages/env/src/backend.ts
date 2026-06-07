import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3001),
    API_VERSION: z.string().default("v1"),

    DATABASE_URL: z.string().url(),
    // Runtime connection for the non-privileged `app_user` role that RLS
    // policies are enforced against. Falls back to DATABASE_URL when unset
    // (e.g. local dev before the role is provisioned) — RLS is then inert.
    RUNTIME_DATABASE_URL: z.string().url().optional(),

    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default("7d"),

    REDIS_URL: z.string().url().optional(),
    REDIS_PASSWORD: z.string().optional(),

    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    ELEVENLABS_API_KEY: z.string().min(1).optional(),

    TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    TWILIO_PHONE_NUMBER: z.string().min(1).optional(),
    TWILIO_WHATSAPP_NUMBER: z.string().min(1).optional(),

    SENTRY_DSN: z.string().url().optional(),
    POSTHOG_API_KEY: z.string().min(1).optional(),
    POSTHOG_HOST: z.string().url().default("https://app.posthog.com"),

    LANGFUSE_SECRET_KEY: z.string().min(1).optional(),
    LANGFUSE_PUBLIC_KEY: z.string().min(1).optional(),
    LANGFUSE_BASE_URL: z.string().url().optional(),

    BACKEND_URL: z.string().url().default("http://localhost:3001"),

    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

    VAPI_API_KEY: z.string().min(1).optional(),
    VAPI_WEBHOOK_SECRET: z.string().min(1).optional(),

    VAULT_ENCRYPTION_KEY: z.string().length(64).optional(),

    COMPOSIO_API_KEY: z.string().min(1).optional(),
    E2B_API_KEY: z.string().min(1).optional(),
    COMPOSIO_OAUTH_CALLBACK_URL: z.string().url().optional(),

    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_FROM_EMAIL: z.string().email().default("noreply@mirrorverse.ai"),
    RESEND_MARKETING_FROM_EMAIL: z.string().email().default("hello@mirrorverse.ai"),
    SUPABASE_HOOK_SECRET: z.string().min(1).optional(),
    // Optional local JWKS cache. Paste the JSON from:
    //   {SUPABASE_URL}/auth/v1/.well-known/jwks.json
    // Eliminates the outbound network call for JWT verification — required when
    // Node.js cannot reach Supabase directly (e.g. firewall restrictions in dev).
    SUPABASE_JWKS: z.string().min(1).optional(),
    APP_URL: z.string().url().default("http://localhost:3000"),

    INNGEST_EVENT_KEY: z.string().min(1).optional(),
    INNGEST_SIGNING_KEY: z.string().min(1).optional(),
    INNGEST_SIGNING_KEY_FALLBACK: z.string().min(1).optional(),
    INNGEST_DEV: z.string().optional(),

    CORS_ORIGIN: z.string().default("http://localhost:3000"),
  },
  runtimeEnv: process.env,
  // Skip validation when explicitly opted out, or during `next build`
  // (NEXT_PHASE=phase-production-build). Server env is read at request time, so
  // a build never needs real secrets — this lets the app's Vercel deploy build
  // this package (a transitive tRPC-types dependency) without backend secrets.
  // Runtime still validates: NEXT_PHASE is phase-production-server when serving.
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION || process.env.NEXT_PHASE === "phase-production-build",
  emptyStringAsUndefined: true,
});
