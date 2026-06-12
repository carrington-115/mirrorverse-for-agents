import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";

import { ApiError } from "@/lib/http/errors";

export const PLAN_LIMIT_CODES = new Set(["QUOTA_EXCEEDED", "PLAN_LIMIT_REACHED"]);

// Returns the human-readable message if `error` represents a plan-limit
// error (tRPC FORBIDDEN/TOO_MANY_REQUESTS with appCode, or a REST ApiError
// with a matching code), otherwise null.
export function getPlanLimitMessage(error: unknown): string | null {
  if (error instanceof TRPCClientError) {
    const appCode = (error.data as { appCode?: string | null } | null)?.appCode;
    if (appCode && PLAN_LIMIT_CODES.has(appCode)) return error.message;
  }
  if (error instanceof ApiError && error.code && PLAN_LIMIT_CODES.has(error.code)) {
    return error.message;
  }
  return null;
}

export const PRICING_MODAL_EVENT = "mirrorverse:open-pricing";

export function openPricingSettings() {
  window.dispatchEvent(new Event(PRICING_MODAL_EVENT));
}

export function showPlanLimitToast(message: string) {
  toast.error(message, {
    action: { label: "Upgrade", onClick: openPricingSettings },
  });
}
