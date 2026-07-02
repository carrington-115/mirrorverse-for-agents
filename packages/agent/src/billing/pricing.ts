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

const OPENAI_PRICING: Record<string, ModelPricePerMillionTokens> = {
  "gpt-5-mini": { input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0.25 },
  "gpt-5-nano": { input: 0.05, output: 0.4, cacheRead: 0.005, cacheWrite: 0.05 },
  "gpt-5": { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 1.25 },
};

const MODEL_PRICING: Record<string, ModelPricePerMillionTokens> = {
  ...ANTHROPIC_PRICING,
  ...OPENAI_PRICING,
};

const DEFAULT_PRICE: ModelPricePerMillionTokens = MODEL_PRICING["claude-haiku-4-5"];

// Published per-1M-token price in USD, input tokens only (no output/cache tiers).
const EMBEDDING_PRICING: Record<string, number> = {
  "text-embedding-3-small": 0.02,
  "text-embedding-3-large": 0.13,
};

const DEFAULT_EMBEDDING_PRICE = EMBEDDING_PRICING["text-embedding-3-small"];

export function getEmbeddingPricePerMillionTokens(model: string): number {
  return EMBEDDING_PRICING[model] ?? DEFAULT_EMBEDDING_PRICE;
}

function canonicalModelId(model: string): string {
  return model.replace(/-\d{8}$/, "");
}

export function getModelPrice(model: string): ModelPricePerMillionTokens {
  const id = canonicalModelId(model);
  return MODEL_PRICING[id] ?? MODEL_PRICING[model] ?? DEFAULT_PRICE;
}

export function isSupportedModel(model: string): boolean {
  const id = canonicalModelId(model);
  return id in MODEL_PRICING || model in MODEL_PRICING;
}

export const SUPPORTED_CHAT_MODEL_IDS: readonly string[] = Object.keys(MODEL_PRICING);

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
