import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ],
    ignoreErrors: [
      "AbortError",
      "TypeError: Failed to fetch",
      "TypeError: NetworkError when attempting to fetch resource.",
      "ChunkLoadError",
    ],
    beforeSend(event) {
      if (event.user) delete event.user.email;
      event.breadcrumbs?.forEach((b) => {
        if (b.category?.startsWith("chat.")) delete b.data;
      });
      return event;
    },
  });
}
