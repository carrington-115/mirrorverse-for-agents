export interface ModelPricePerMillionTokens {
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly cacheWrite: number;
}

const MICROCENTS_PER_DOLLAR = 100 * 10_000;

const ANTHROPIC_PRICING: Record<string, ModelPricePerMillionTokens> = {
  "claude-haiku-4-5": { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
  "claude-sonnet-4-5": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-opus-4-5": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  "claude-opus-4-6": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  "claude-opus-4-7": { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
};

const DEFAULT_PRICE: ModelPricePerMillionTokens = ANTHROPIC_PRICING["claude-haiku-4-5"];

function canonicalModelId(model: string): string {
  return model.replace(/-\d{8}$/, "");
}

export function getModelPrice(model: string): ModelPricePerMillionTokens {
  const id = canonicalModelId(model);
  return ANTHROPIC_PRICING[id] ?? ANTHROPIC_PRICING[model] ?? DEFAULT_PRICE;
}

export function isSupportedModel(model: string): boolean {
  const id = canonicalModelId(model);
  return id in ANTHROPIC_PRICING || model in ANTHROPIC_PRICING;
}

export const SUPPORTED_CHAT_MODEL_IDS: readonly string[] = Object.keys(ANTHROPIC_PRICING);

export function tokensToCents(
  tokens: number,
  pricePerMillionDollars: number,
): { microcents: number } {
  if (tokens <= 0) return { microcents: 0 };
  const microcents = Math.round(
    (tokens * pricePerMillionDollars * MICROCENTS_PER_DOLLAR) / 1_000_000,
  );
  return { microcents };
}

export function microcentsToCents(microcents: number): number {
  return Math.round(microcents / 10_000);
}
