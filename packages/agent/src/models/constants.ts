export const ANTHROPIC_MODEL_PREFIX = "claude-";
export const ANTHROPIC_OPUS_PREFIX = "claude-opus-";
export const OPENAI_GPT_PREFIX = "gpt-";
export const OPENAI_REASONING_PREFIX = "o";
export const GOOGLE_GEMINI_PREFIX = "gemini-";

// Latest validated Haiku build. Used for cheap classification tasks (title generation).
export const DEFAULT_HAIKU_MODEL = "claude-haiku-4-5";

// Latest validated Sonnet build. Used as the default orchestrator model for
// multi-step tool-calling loops — materially more reliable than Haiku for
// routing decisions and schema adherence.
export const DEFAULT_SONNET_MODEL = "claude-sonnet-4-6";
