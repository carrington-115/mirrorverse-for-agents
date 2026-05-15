import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type ModelProvider = "anthropic" | "openai";

export function providerForModel(modelId: string): ModelProvider {
  if (modelId.startsWith("claude-")) return "anthropic";
  if (modelId.startsWith("gpt-") || modelId.startsWith("o")) return "openai";
  throw new Error(`Cannot determine provider for model id: ${modelId}`);
}

export function resolveModel(modelId: string): LanguageModel {
  const provider = providerForModel(modelId);
  switch (provider) {
    case "anthropic":
      return anthropic(modelId);
    case "openai":
      return openai(modelId);
  }
}
