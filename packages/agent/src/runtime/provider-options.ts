import { providerForModel } from "../models/resolve";

export function buildProviderOptions(modelId: string) {
  const provider = providerForModel(modelId);
  if (provider !== "anthropic") return undefined;

  // We don't enable extended thinking. We hide native reasoning from the UI
  // anyway (chain-of-thought is reserved for builder narration only), so
  // paying for thinking tokens is wasted.
  return {
    anthropic: {
      cacheControl: { type: "ephemeral" as const },
      sendReasoning: false,
    },
  };
}
