import type { LanguageModelUsage } from "ai";

import { getModelPrice, microcentsToCents, tokensToCents } from "./pricing.js";

export type AgentUsageKind =
  | "llm_input"
  | "llm_input_cache_read"
  | "llm_input_cache_write"
  | "llm_output";

export interface AgentUsageEntry {
  readonly kind: AgentUsageKind;
  readonly quantity: number;
  readonly unit: "token";
  readonly costCents: number;
  readonly model: string;
}

export interface StepUsageBreakdown {
  readonly entries: readonly AgentUsageEntry[];
  readonly totalCostCents: number;
}

interface ExtendedUsage extends LanguageModelUsage {
  readonly cachedInputTokens?: number;
  readonly cachedInputTokensWrite?: number;
}

function readCacheReadTokens(usage: ExtendedUsage): number {
  if (typeof usage.cachedInputTokens === "number") return usage.cachedInputTokens;
  return 0;
}

function readCacheWriteTokens(usage: ExtendedUsage): number {
  if (typeof usage.cachedInputTokensWrite === "number") return usage.cachedInputTokensWrite;
  return 0;
}

export function breakdownStepUsage(
  usage: LanguageModelUsage | undefined,
  model: string,
): StepUsageBreakdown {
  if (!usage) return { entries: [], totalCostCents: 0 };

  const ext = usage as ExtendedUsage;
  const price = getModelPrice(model);
  const cacheReadTokens = readCacheReadTokens(ext);
  const cacheWriteTokens = readCacheWriteTokens(ext);
  const uncachedInputTokens = Math.max(
    0,
    (usage.inputTokens ?? 0) - cacheReadTokens - cacheWriteTokens,
  );
  const outputTokens = usage.outputTokens ?? 0;

  const entries: AgentUsageEntry[] = [];
  let totalMicrocents = 0;

  if (uncachedInputTokens > 0) {
    const { microcents } = tokensToCents(uncachedInputTokens, price.input);
    totalMicrocents += microcents;
    entries.push({
      kind: "llm_input",
      quantity: uncachedInputTokens,
      unit: "token",
      costCents: microcentsToCents(microcents),
      model,
    });
  }
  if (cacheReadTokens > 0) {
    const { microcents } = tokensToCents(cacheReadTokens, price.cacheRead);
    totalMicrocents += microcents;
    entries.push({
      kind: "llm_input_cache_read",
      quantity: cacheReadTokens,
      unit: "token",
      costCents: microcentsToCents(microcents),
      model,
    });
  }
  if (cacheWriteTokens > 0) {
    const { microcents } = tokensToCents(cacheWriteTokens, price.cacheWrite);
    totalMicrocents += microcents;
    entries.push({
      kind: "llm_input_cache_write",
      quantity: cacheWriteTokens,
      unit: "token",
      costCents: microcentsToCents(microcents),
      model,
    });
  }
  if (outputTokens > 0) {
    const { microcents } = tokensToCents(outputTokens, price.output);
    totalMicrocents += microcents;
    entries.push({
      kind: "llm_output",
      quantity: outputTokens,
      unit: "token",
      costCents: microcentsToCents(microcents),
      model,
    });
  }

  return { entries, totalCostCents: microcentsToCents(totalMicrocents) };
}
