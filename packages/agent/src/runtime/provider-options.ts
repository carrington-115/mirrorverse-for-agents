import { ANTHROPIC_OPUS_PREFIX } from "../models/constants";
import { providerForModel } from "../models/resolve";

import { ANTHROPIC_THINKING_BUDGET_TOKENS } from "./constants";

export function buildProviderOptions(modelId: string) {
  const provider = providerForModel(modelId);
  if (provider !== "anthropic") return undefined;

  // Opus 4.x uses adaptive thinking via output_config.effort and rejects the
  // enabled-budget form; Haiku and Sonnet accept it.
  const supportsEnabledThinking = !modelId.startsWith(ANTHROPIC_OPUS_PREFIX);

  return {
    anthropic: {
      cacheControl: { type: "ephemeral" as const },
      sendReasoning: true,
      ...(supportsEnabledThinking
        ? {
            thinking: {
              type: "enabled" as const,
              budgetTokens: ANTHROPIC_THINKING_BUDGET_TOKENS,
            },
          }
        : {}),
    },
  };
}
