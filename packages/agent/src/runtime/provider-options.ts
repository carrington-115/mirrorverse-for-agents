import { ANTHROPIC_OPUS_PREFIX } from "../models/constants.js";
import { providerForModel } from "../models/resolve.js";

import {
  ANTHROPIC_ADAPTIVE_THINKING_EFFORT,
  ANTHROPIC_THINKING_BUDGET_TOKENS,
} from "./constants.js";

export function buildProviderOptions(modelId: string) {
  const provider = providerForModel(modelId);
  if (provider !== "anthropic") return undefined;

  // Thinking is enabled so the model's real reasoning surfaces in the
  // chain-of-thought timeline alongside our builder narration. `sendReasoning`
  // replays thinking blocks within the live multi-step turn so thinking →
  // tool_use ordering stays valid (prior-turn reasoning is stripped from
  // history in sanitize-history, so this only affects the in-flight turn).
  //
  // Opus 4.7 dropped the legacy `thinking: { type: "enabled", budget_tokens }`
  // API; it requires adaptive thinking plus `output_config.effort` instead.
  // Older Anthropic models (Sonnet 4.6, Haiku 4.5) still use the token budget.
  const thinkingOptions = modelId.startsWith(ANTHROPIC_OPUS_PREFIX)
    ? {
        thinking: { type: "adaptive", display: "summarized" as const },
        effort: ANTHROPIC_ADAPTIVE_THINKING_EFFORT,
      }
    : {
        thinking: {
          type: "enabled" as const,
          budgetTokens: ANTHROPIC_THINKING_BUDGET_TOKENS,
        },
      };

  return {
    anthropic: {
      cacheControl: { type: "ephemeral" as const },
      ...thinkingOptions,
      sendReasoning: true,
    },
  };
}
