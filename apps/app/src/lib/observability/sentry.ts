import * as Sentry from "@sentry/nextjs";

export function setSentryUser(id: string) {
  Sentry.setUser({ id });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({ category, message, data, level: "info" });
}
