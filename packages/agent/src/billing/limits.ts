export interface ChatLimits {
  readonly maxMessagesPerChat: number;
  readonly maxCostCentsPerChat: number;
}

export const DEFAULT_CHAT_LIMITS: ChatLimits = {
  maxMessagesPerChat: 100,
  maxCostCentsPerChat: 200,
};

export type ChatLimitBreach =
  | { readonly kind: "messages"; readonly used: number; readonly cap: number }
  | { readonly kind: "cost"; readonly usedCents: number; readonly capCents: number };

export function checkChatLimits(
  stats: { readonly messageCount: number; readonly totalCostCents: number },
  limits: ChatLimits = DEFAULT_CHAT_LIMITS,
): ChatLimitBreach | null {
  if (stats.messageCount >= limits.maxMessagesPerChat) {
    return { kind: "messages", used: stats.messageCount, cap: limits.maxMessagesPerChat };
  }
  if (stats.totalCostCents >= limits.maxCostCentsPerChat) {
    return {
      kind: "cost",
      usedCents: stats.totalCostCents,
      capCents: limits.maxCostCentsPerChat,
    };
  }
  return null;
}

export function describeChatLimitBreach(breach: ChatLimitBreach): string {
  if (breach.kind === "messages") {
    return `Chat reached its ${breach.cap}-message cap. Start a new chat to continue.`;
  }
  return `Chat reached its $${(breach.capCents / 100).toFixed(2)} cost cap. Start a new chat to continue.`;
}
