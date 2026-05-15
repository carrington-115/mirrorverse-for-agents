import posthog from "posthog-js";

export type AnalyticsEvent =
  | "chat_sent"
  | "workflow_committed"
  | "run_failed"
  | "plan_upgraded"
  | "integration_connected"
  | "integration_disconnected";

export function identifyUser(id: string, props: { plan: string }) {
  posthog.identify(id, props);
}

export function resetUser() {
  posthog.reset();
}

export function capture(event: AnalyticsEvent, props?: Record<string, unknown>) {
  posthog.capture(event, props);
}
