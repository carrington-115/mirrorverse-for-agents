import { MOCK_AGENTS } from "@/lib/data";
import type { Agent } from "@/lib/types";

declare global {
  var __agentStore: Agent[] | undefined;
}

if (!globalThis.__agentStore) {
  globalThis.__agentStore = MOCK_AGENTS;
}

export function getAgentStore(): Agent[] {
  return globalThis.__agentStore!;
}
