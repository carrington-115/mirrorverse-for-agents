import { DEFAULT_SONNET_MODEL } from "../models/constants.js";

export const LOG_PREFIX = "[mirrorpilot]";

export const DEFAULT_MIRRORPILOT_MODEL = DEFAULT_SONNET_MODEL;

export const DEFAULT_MAX_STEPS = 8;

// Hard per-execution token ceiling. Prevents runaway loops from exhausting
// quota in a single chat turn regardless of step count.
export const DEFAULT_MAX_TOKENS = 32_000;

export const ANTHROPIC_THINKING_BUDGET_TOKENS = 8000;

// Opus 4.7+ uses adaptive thinking with an effort level instead of a token
// budget. "high" keeps the orchestrator's reasoning strong without forcing the
// maximum spend of "xhigh"/"max".
export const ANTHROPIC_ADAPTIVE_THINKING_EFFORT = "high" as const;
