import { toast } from "sonner";

import { PLAN_LIMIT_CODES, showPlanLimitToast } from "@/features/billing/lib/plan-limit-error";

interface ChatErrorBody {
  error?: string;
  code?: string;
}

function parseChatErrorBody(message: string): ChatErrorBody | null {
  try {
    const parsed = JSON.parse(message) as unknown;
    if (typeof parsed === "object" && parsed !== null) return parsed as ChatErrorBody;
  } catch {
    // Not a JSON body — fall through to the raw message.
  }
  return null;
}

export function handleChatError(error: Error) {
  const parsed = parseChatErrorBody(error.message);
  if (parsed?.code && PLAN_LIMIT_CODES.has(parsed.code) && parsed.error) {
    showPlanLimitToast(parsed.error);
    return;
  }
  toast.error(parsed?.error ?? error.message ?? "Failed to send message");
}
