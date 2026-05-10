import { env } from "@mirrorverse/env/backend";

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
  },

  auth: {
    clerk: {
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
    },
  },

  ai: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
    },
    elevenlabs: {
      apiKey: env.ELEVENLABS_API_KEY,
    },
  },

  messaging: {
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
      whatsappNumber: env.TWILIO_WHATSAPP_NUMBER,
    },
  },

  sentry: {
    dsn: env.SENTRY_DSN,
  },

  posthog: {
    apiKey: env.POSTHOG_API_KEY,
    host: env.POSTHOG_HOST,
  },

  cors: {
    origin: env.CORS_ORIGIN.split(","),
  },
} as const;
