import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event) {
      if (event.user) delete event.user.email;
      event.breadcrumbs?.forEach((b) => {
        if (b.category?.startsWith("chat.")) delete b.data;
      });
      return event;
    },
  });
}
