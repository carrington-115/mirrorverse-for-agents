import { DEFAULT_HAIKU_MODEL } from "../models/constants";

export const LOG_PREFIX = "[mirropilot]";

export const DEFAULT_MIRROPILOT_MODEL = DEFAULT_HAIKU_MODEL;

export const DEFAULT_MAX_STEPS = 2;

export const ANTHROPIC_THINKING_BUDGET_TOKENS = 8000;

// Opus 4.7+ uses adaptive thinking with an effort level instead of a token
// budget. "high" keeps the orchestrator's reasoning strong without forcing the
// maximum spend of "xhigh"/"max".
export const ANTHROPIC_ADAPTIVE_THINKING_EFFORT = "high" as const;
