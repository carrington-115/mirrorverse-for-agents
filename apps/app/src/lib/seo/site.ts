import { env } from "@mirrorverse/env/app";

// SKIP_ENV_VALIDATION (used in CI builds) leaves env values undefined; fall back so
// metadataBase / canonical URL builders don't throw at build-time page-data collection.
const FALLBACK_SITE_URL = "http://localhost:3000";

export const siteConfig = {
  name: "Mirrorverse",
  shortName: "Mirrorverse",
  description: "The platform to broaden collaboration between humans and agents.",
  url: env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL,
  twitterHandle: "@mirroverse",
  themeColor: "#0a0a0a",
  backgroundColor: "#ffffff",
  locale: "en_US",
} as const;
