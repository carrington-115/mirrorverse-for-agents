"use server";

import { getAgentStore } from "@/lib/agent-store";
import { AgentWorkflowRef } from "@/lib/types";
import { randomUUID } from "crypto";

const DEFAULT_WORKFLOWS: AgentWorkflowRef[] = [
  {
    id: "wf-1",
    name: "Order status checker",
    status: "active",
    lastUpdated: new Date("2026-02-12T14:30:00"),
    isConnected: false,
  },
  {
    id: "wf-2",
    name: "QA Agent workflow",
    status: "active",
    lastUpdated: new Date("2026-03-05T16:38:00"),
    isConnected: false,
  },
];

export async function createAgent(
  name: string,
  _description: string,
  _deployTarget: string,
): Promise<string> {
  const newId = randomUUID();
  getAgentStore().push({
    id: newId,
    name: name.trim(),
    status: "inactive",
    lastUsed: new Date(),
    lastUpdated: new Date(),
    workflows: DEFAULT_WORKFLOWS.map((w) => ({ ...w })),
    knowledgeBase: [],
    tools: [],
  });
  return newId;
}
