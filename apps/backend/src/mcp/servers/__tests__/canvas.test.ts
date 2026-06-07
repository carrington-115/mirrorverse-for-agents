import { randomUUID } from "node:crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

import type { WorkflowDocument } from "@mirrorverse/types";

// Stub the DB so canvas server never needs a real database.
const mockDoc: WorkflowDocument = {
  id: "wf-1",
  name: "Test Workflow",
  version: 1,
  nodes: [
    { id: "n1", type: "trigger.manual", position: { x: 0, y: 0 }, params: {} },
  ],
  connections: [],
};

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
};

function buildSelectChain(returnValue: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => chain);
  chain.limit = vi.fn(() => Promise.resolve(returnValue));
  return chain;
}

function buildInsertChain() {
  return { values: vi.fn(() => Promise.resolve()) };
}

function buildUpdateChain() {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn(() => chain);
  chain.where = vi.fn(() => Promise.resolve());
  return chain;
}

describe("canvas server", () => {
  const workflowId = randomUUID();
  const ctx = { db: mockDb as never, workspaceId: "ws-1", userId: "u-1" };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb.select.mockReturnValue(
      buildSelectChain([{ versionNumber: 1, document: mockDoc }]),
    );
    mockDb.insert.mockReturnValue(buildInsertChain());
    mockDb.update.mockReturnValue(buildUpdateChain());
    mockDb.transaction.mockImplementation(
      async (fn: (tx: typeof mockDb) => Promise<void>) => {
        await fn(mockDb);
      },
    );
  });

  it("add_node appends a node to the document", async () => {
    process.env.SKIP_ENV_VALIDATION = "true";
    const { canvasServer } = await import("../canvas");

    const result = (await canvasServer.tools.add_node.handler(
      {
        workflowId,
        nodeType: "core.http_request",
        params: { url: "https://example.com" },
        position: { x: 100, y: 200 },
      },
      ctx,
    )) as { document: WorkflowDocument };

    expect(result.document.nodes).toHaveLength(2);
    expect(result.document.nodes[1]?.type).toBe("core.http_request");
    expect(result.document.nodes[1]?.params).toEqual({
      url: "https://example.com",
    });
  });

  it("connect_nodes appends a connection", async () => {
    const { canvasServer } = await import("../canvas");

    const result = (await canvasServer.tools.connect_nodes.handler(
      {
        workflowId,
        fromNodeId: "n1",
        fromPort: "main",
        toNodeId: "n2",
        toPort: "main",
      },
      ctx,
    )) as { document: WorkflowDocument };

    expect(result.document.connections).toHaveLength(1);
    expect(result.document.connections[0]).toMatchObject({
      from: "n1",
      fromPort: "main",
      to: "n2",
      toPort: "main",
    });
  });

  it("set_param updates the target node param", async () => {
    const { canvasServer } = await import("../canvas");

    const result = (await canvasServer.tools.set_param.handler(
      { workflowId, nodeId: "n1", paramKey: "label", paramValue: "Hello" },
      ctx,
    )) as { document: WorkflowDocument };

    const updatedNode = result.document.nodes.find((n) => n.id === "n1");
    expect(updatedNode?.params).toMatchObject({ label: "Hello" });
  });

  it("set_param throws when workflow not found", async () => {
    mockDb.select.mockReturnValue(buildSelectChain([]));
    const { canvasServer } = await import("../canvas");

    await expect(
      canvasServer.tools.set_param.handler(
        {
          workflowId: "nonexistent",
          nodeId: "n1",
          paramKey: "x",
          paramValue: 1,
        },
        ctx,
      ),
    ).rejects.toThrow(/not found/);
  });
});
