import { describe, expect, it, vi } from "vitest";
import type { WorkflowDocument, WorkflowNode } from "@mirrorverse/types";

// agent.ts imports @mirrorverse/db (env-validating at module load) and the
// knowledge repo/search modules — none of which findSlotNode touches. Stub
// them out so importing this module doesn't require real env vars.
vi.mock("@mirrorverse/db", () => ({ schema: {} }));
vi.mock("../../../knowledge/repo", () => ({ filterKbIdsByWorkspace: vi.fn() }));
vi.mock("../../../knowledge/search", () => ({
  searchAcrossKnowledgeBases: vi.fn(),
}));

import { findSlotNode } from "./agent";

function node(id: string, type: string): WorkflowNode {
  return { id, type, position: { x: 0, y: 0 }, params: {} };
}

function doc(
  nodes: WorkflowNode[],
  connections: WorkflowDocument["connections"],
): WorkflowDocument {
  return { name: "test", nodes, connections };
}

describe("findSlotNode", () => {
  const agent = node("agent_1", "ai.agent");
  const lm = node("lm_1", "ai.language_model");
  const retriever = node("retriever_1", "ai.retriever");

  it("matches a bare toPort (AI-generated connection)", () => {
    const document = doc(
      [agent, lm],
      [
        {
          from: "lm_1",
          fromPort: "ai_languageModel",
          to: "agent_1",
          toPort: "ai_languageModel",
        },
      ],
    );
    expect(findSlotNode(document, "agent_1", "ai_languageModel")).toEqual(lm);
  });

  it("matches a -in suffixed toPort (user-drawn canvas connection)", () => {
    const document = doc(
      [agent, lm],
      [
        {
          from: "lm_1",
          fromPort: "ai_languageModel-out",
          to: "agent_1",
          toPort: "ai_languageModel-in",
        },
      ],
    );
    expect(findSlotNode(document, "agent_1", "ai_languageModel")).toEqual(lm);
  });

  it("does not match a connection for a different slot", () => {
    const document = doc(
      [agent, retriever],
      [
        {
          from: "retriever_1",
          fromPort: "ai_retriever-out",
          to: "agent_1",
          toPort: "ai_retriever-in",
        },
      ],
    );
    expect(findSlotNode(document, "agent_1", "ai_languageModel")).toBeNull();
  });

  it("returns null when there is no matching connection", () => {
    const document = doc([agent], []);
    expect(findSlotNode(document, "agent_1", "ai_languageModel")).toBeNull();
  });

  it("returns the correct source node when multiple connections exist", () => {
    const document = doc(
      [agent, lm, retriever],
      [
        {
          from: "retriever_1",
          fromPort: "ai_retriever-out",
          to: "agent_1",
          toPort: "ai_retriever-in",
        },
        {
          from: "lm_1",
          fromPort: "ai_languageModel-out",
          to: "agent_1",
          toPort: "ai_languageModel-in",
        },
      ],
    );
    expect(findSlotNode(document, "agent_1", "ai_languageModel")).toEqual(lm);
    expect(findSlotNode(document, "agent_1", "ai_retriever")).toEqual(
      retriever,
    );
  });
});
