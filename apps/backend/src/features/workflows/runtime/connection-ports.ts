// AI composable-slot port names (and their -in/-out suffixed canvas-handle
// variants). Connections on these ports wire AI subcomponents (language
// models, memory, retrievers, tools, output parsers, voice) into an
// ai.agent / ai.voice_agent node — they are not part of the main data-flow
// graph and must be excluded from the walker's adjacency.
export const AI_SLOT_NAMES = [
  "ai_languageModel",
  "ai_memory",
  "ai_retriever",
  "ai_tool",
  "ai_outputParser",
  "ai_chain",
  "voice",
] as const;

/**
 * True if `port` is an AI-slot port — bare (e.g. "ai_languageModel") or with
 * a canvas-handle suffix ("ai_languageModel-in" / "ai_languageModel-out").
 */
export function isAiSlotPort(port: string): boolean {
  return AI_SLOT_NAMES.some(
    (slot) => port === slot || port === `${slot}-in` || port === `${slot}-out`,
  );
}

/**
 * True if `port` refers to the named AI slot — bare, or with a -in/-out
 * canvas-handle suffix. Used by ai.agent's findSlotNode to match connections
 * regardless of which handle-id convention produced them.
 */
export function matchesSlotPort(port: string, slotName: string): boolean {
  return (
    port === slotName || port === `${slotName}-in` || port === `${slotName}-out`
  );
}
