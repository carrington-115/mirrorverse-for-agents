"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

import { env } from "@mirrorverse/env/app";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
      person_profiles: "identified_only",
      session_recording: {
        maskAllInputs: true,
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
