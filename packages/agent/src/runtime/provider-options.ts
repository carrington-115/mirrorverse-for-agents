import { providerForModel } from "../models/resolve";

const THINKING_BUDGET_TOKENS = 8000;

export function buildProviderOptions(modelId: string) {
  const provider = providerForModel(modelId);
  if (provider !== "anthropic") return undefined;

  // Opus 4.x uses adaptive thinking via output_config.effort and rejects the
  // enabled-budget form. Haiku and Sonnet accept it.
  const supportsEnabledThinking = !modelId.startsWith("claude-opus-");

  return {
    anthropic: {
      cacheControl: { type: "ephemeral" as const },
      sendReasoning: true,
      ...(supportsEnabledThinking
        ? { thinking: { type: "enabled" as const, budgetTokens: THINKING_BUDGET_TOKENS } }
        : {}),
    },
  };
}
