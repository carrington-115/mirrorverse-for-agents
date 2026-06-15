import { describe, expect, it, vi } from "vitest";
import type { Database } from "@mirrorverse/db";
import type {
  WorkflowConnection,
  WorkflowDocument,
  WorkflowNode,
} from "@mirrorverse/types";

// graph-walker.ts transitively imports @mirrorverse/db and
// @mirrorverse/env/backend (env-validating at module load) via step-writer
// and the interpreters (agent, human-review). Stub these out — none of the
// node types exercised here (trigger/flow.if/flow.loop/flow.noop/transform)
// touch them, and the mock `db` below replaces real db calls entirely.
vi.mock("@mirrorverse/db", () => ({
  schema: { workflowRunSteps: { id: "id" } },
  eq: vi.fn(),
}));
vi.mock("@mirrorverse/env/backend", () => ({ env: {} }));
vi.mock("../../knowledge/repo", () => ({ filterKbIdsByWorkspace: vi.fn() }));
vi.mock("../../knowledge/search", () => ({
  searchAcrossKnowledgeBases: vi.fn(),
}));
vi.mock("../../notifications/email", () => ({ sendReviewEmail: vi.fn() }));
vi.mock("../../notifications/slack", () => ({ sendSlackReview: vi.fn() }));
// interpretCode pulls in the e2b SDK, which has an ESM/CJS interop issue
// (chalk) under vitest's CJS transform. Not exercised by this test's doc.
vi.mock("./interpreters/code", () => ({ interpretCode: vi.fn() }));

import {
  buildIncomingCount,
  buildMainAdjacency,
  walkGraph,
} from "./graph-walker";
import { CostTracker } from "./cost-tracker";
import type { ExecutionContext } from "./interpreters/types";

function node(
  id: string,
  type: string,
  params: Record<string, unknown> = {},
): WorkflowNode {
  return { id, type, position: { x: 0, y: 0 }, params };
}

function doc(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
): WorkflowDocument {
  return { name: "test", nodes, connections };
}

describe("buildMainAdjacency", () => {
  it("includes flow.if branch edges alongside main edges", () => {
    const document = doc(
      [
        node("trigger_1", "trigger.manual"),
        node("if_1", "flow.if"),
        node("noop_true", "flow.noop"),
        node("noop_false", "flow.noop"),
      ],
      [
        { from: "trigger_1", fromPort: "main", to: "if_1", toPort: "main" },
        { from: "if_1", fromPort: "true", to: "noop_true", toPort: "main" },
        { from: "if_1", fromPort: "false", to: "noop_false", toPort: "main" },
      ],
    );

    const adj = buildMainAdjacency(document);

    expect(adj.get("trigger_1")).toEqual([
      { toNodeId: "if_1", fromPort: "main", toPort: "main" },
    ]);
    expect(adj.get("if_1")).toEqual([
      { toNodeId: "noop_true", fromPort: "true", toPort: "main" },
      { toNodeId: "noop_false", fromPort: "false", toPort: "main" },
    ]);
  });

  it("excludes AI composable-slot connections (bare and -in/-out variants)", () => {
    const document = doc(
      [
        node("agent_1", "ai.agent"),
        node("lm_1", "ai.language_model"),
        node("retriever_1", "ai.retriever"),
      ],
      [
        {
          from: "lm_1",
          fromPort: "ai_languageModel",
          to: "agent_1",
          toPort: "ai_languageModel",
        },
        {
          from: "retriever_1",
          fromPort: "ai_retriever-out",
          to: "agent_1",
          toPort: "ai_retriever-in",
        },
      ],
    );

    const adj = buildMainAdjacency(document);

    expect(adj.get("lm_1")).toBeUndefined();
    expect(adj.get("retriever_1")).toBeUndefined();
  });
});

describe("buildIncomingCount", () => {
  it("counts branch edges feeding a flow.merge", () => {
    const document = doc(
      [node("if_1", "flow.if"), node("merge_1", "flow.merge")],
      [
        { from: "if_1", fromPort: "true", to: "merge_1", toPort: "main" },
        { from: "if_1", fromPort: "false", to: "merge_1", toPort: "main" },
      ],
    );

    expect(buildIncomingCount(document).get("merge_1")).toBe(2);
  });

  it("excludes AI composable-slot connections", () => {
    const document = doc(
      [node("agent_1", "ai.agent"), node("lm_1", "ai.language_model")],
      [
        {
          from: "lm_1",
          fromPort: "ai_languageModel-out",
          to: "agent_1",
          toPort: "ai_languageModel-in",
        },
      ],
    );

    expect(buildIncomingCount(document).get("agent_1")).toBeUndefined();
  });
});

describe("walkGraph", () => {
  it("follows the chosen flow.if branch and stores a flow.loop's items for downstream reference", async () => {
    const document = doc(
      [
        node("trigger_1", "trigger.manual"),
        node("if_1", "flow.if", {
          conditions: [
            {
              leftValue: "{{ $json.go }}",
              operator: "equals",
              rightValue: true,
            },
          ],
          combinator: "and",
        }),
        node("noop_true", "flow.noop"),
        node("noop_false", "flow.noop"),
        node("loop_1", "flow.loop", {
          iterableExpression: "{{ $json.items }}",
        }),
        node("transform_1", "transform", {
          op: "edit_fields",
          config: { fields: { loopItems: "{{ $('loop_1').item.json }}" } },
        }),
      ],
      [
        { from: "trigger_1", fromPort: "main", to: "if_1", toPort: "main" },
        { from: "if_1", fromPort: "true", to: "noop_true", toPort: "main" },
        { from: "if_1", fromPort: "false", to: "noop_false", toPort: "main" },
        { from: "trigger_1", fromPort: "main", to: "loop_1", toPort: "main" },
        { from: "loop_1", fromPort: "main", to: "transform_1", toPort: "main" },
      ],
    );

    // Pairs up writeStepStart's `nodeId` with the next writeStepResult's `output`,
    // relying on each executeNode call awaiting start-then-result before the next runs.
    const pendingNodeIds: string[] = [];
    const stepResults: { nodeId: string; output: unknown }[] = [];

    // Minimal chainable mock matching step-writer's insert/update call shapes.
    const mockDb = {
      insert: () => ({
        values: (values: { nodeId: string }) => {
          pendingNodeIds.push(values.nodeId);
          return { onConflictDoUpdate: () => Promise.resolve(undefined) };
        },
      }),
      update: () => ({
        set: (setObj: { output?: unknown }) => {
          const nodeId = pendingNodeIds.shift()!;
          stepResults.push({ nodeId, output: setObj.output });
          return { where: () => Promise.resolve(undefined) };
        },
      }),
    } as unknown as Database;

    const mockStep = {
      run: (_id: string, fn: () => unknown) => Promise.resolve(fn()),
    } as unknown as Parameters<typeof walkGraph>[4];

    const ctx: ExecutionContext = {
      db: mockDb,
      workspaceId: "ws_1",
      runId: "run_1",
      costTracker: new CostTracker(),
      env: {},
    };

    const result = await walkGraph(
      document,
      "trigger_1",
      { go: true, items: [1, 2] },
      ctx,
      mockStep,
    );

    expect(result.status).toBe("succeeded");

    const executedNodeIds = stepResults.map((r) => r.nodeId);
    expect(executedNodeIds).toContain("noop_true");
    expect(executedNodeIds).not.toContain("noop_false");

    const transformResult = stepResults.find((r) => r.nodeId === "transform_1");
    expect(transformResult?.output).toEqual({ loopItems: [1, 2] });
  });
});
