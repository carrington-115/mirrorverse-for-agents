import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { ANTHROPIC_MODEL_PREFIX, OPENAI_GPT_PREFIX, OPENAI_REASONING_PREFIX } from "./constants";

export type ModelProvider = "anthropic" | "openai";

export function providerForModel(modelId: string): ModelProvider {
  if (modelId.startsWith(ANTHROPIC_MODEL_PREFIX)) return "anthropic";
  if (modelId.startsWith(OPENAI_GPT_PREFIX) || modelId.startsWith(OPENAI_REASONING_PREFIX)) {
    return "openai";
  }
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
