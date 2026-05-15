import * as Sentry from "@sentry/node";

import { env } from "@mirrorverse/env/backend";

export { Sentry };

export function initSentry() {
  if (!env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event) {
      if (event.user) {
        event.user = { ...event.user, email: undefined };
      }
      event.breadcrumbs?.forEach((b) => {
        if (b.category?.startsWith("chat.")) b.data = undefined;
      });
      return event;
    },
  });
}
