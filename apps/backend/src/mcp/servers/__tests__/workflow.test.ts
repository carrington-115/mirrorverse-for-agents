import { randomUUID } from "node:crypto";
import { describe, expect, it, vi, beforeEach, beforeAll } from "vitest";

import type { WorkflowDocumentInput } from "@mirrorverse/agent/schemas";

const sampleDoc: WorkflowDocumentInput = {
  name: "My Workflow",
  nodes: [
    { id: "t1", type: "trigger.manual", position: { x: 0, y: 0 }, params: {} },
  ],
  connections: [],
};

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn(),
};

function buildSelectChain(returnValue: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn(() => chain);
  chain.innerJoin = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => chain);
  chain.limit = vi.fn(() => Promise.resolve(returnValue));
  // Drizzle query builders are thenable at any point in the chain (e.g. a
  // bare `.where(...)` with no trailing `.limit()` is awaitable directly).
  chain.then = (resolve: (v: unknown[]) => void) => resolve(returnValue);
  return chain;
}

function buildDeleteChain(returnValue: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.where = vi.fn(() => chain);
  chain.returning = vi.fn(() => Promise.resolve(returnValue));
  return chain;
}

describe("workflow server", () => {
  // The first import of the server module loads the whole runtime graph,
  // which can take several seconds on a loaded machine. Load it once here,
  // outside the 5s per-test timeout.
  beforeAll(async () => {
    process.env.SKIP_ENV_VALIDATION = "true";
    await import("../workflow");
  }, 30_000);

  const ctx = { db: mockDb as never, workspaceId: "ws-1", userId: "u-1" };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SKIP_ENV_VALIDATION = "true";

    mockDb.insert.mockReturnValue({ values: vi.fn(() => Promise.resolve()) });
    // No active subscription by default → no workflow-limit enforcement.
    // Tests that need a specific select() result override this.
    mockDb.select.mockReturnValue(buildSelectChain([]));
    const updateChain: Record<string, unknown> = {};
    updateChain.set = vi.fn(() => updateChain);
    updateChain.where = vi.fn(() => Promise.resolve());
    mockDb.update.mockReturnValue(updateChain);
    mockDb.transaction.mockImplementation(
      async (fn: (tx: typeof mockDb) => Promise<void>) => {
        await fn(mockDb);
      },
    );
  });

  it("commit creates a new workflow when no workflowId given", async () => {
    const { workflowServer } = await import("../workflow");
    const result = (await workflowServer.tools.commit.handler(
      { document: sampleDoc, summary: "initial" },
      ctx,
    )) as { workflowId: string; versionNumber: number };

    expect(result.workflowId).toBeTruthy();
    expect(result.versionNumber).toBe(1);
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // workflows + workflowVersions
  });

  it("commit throws when the workflow limit for the plan is reached", async () => {
    mockDb.select
      .mockReturnValueOnce(
        buildSelectChain([
          {
            subscription: {
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(),
            },
            plan: { limits: { maxWorkflows: 1 } },
          },
        ]),
      )
      .mockReturnValueOnce(buildSelectChain([{ count: 1 }]));

    const { workflowServer } = await import("../workflow");
    await expect(
      workflowServer.tools.commit.handler(
        { document: sampleDoc, summary: "initial" },
        ctx,
      ),
    ).rejects.toThrow(/limit/i);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("commit adds a new version to an existing workflow", async () => {
    const existingId = randomUUID();
    mockDb.select.mockReturnValue(
      buildSelectChain([{ versionNumber: 3, document: sampleDoc }]),
    );

    const { workflowServer } = await import("../workflow");
    const result = (await workflowServer.tools.commit.handler(
      { document: sampleDoc, workflowId: existingId, summary: "update" },
      ctx,
    )) as { workflowId: string; versionNumber: number };

    expect(result.workflowId).toBe(existingId);
    expect(result.versionNumber).toBe(4);
  });

  it("list returns workflows", async () => {
    const rows = [
      {
        id: "w1",
        name: "Wf 1",
        kind: "automation",
        status: "active",
        updatedAt: new Date(),
      },
    ];
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(() => Promise.resolve(rows));
    mockDb.select.mockReturnValue(chain);

    const { workflowServer } = await import("../workflow");
    const result = (await workflowServer.tools.list.handler(
      { limit: 10 },
      ctx,
    )) as {
      workflows: typeof rows;
    };
    expect(result.workflows).toHaveLength(1);
    expect(result.workflows[0]?.name).toBe("Wf 1");
  });

  it("archive returns ok: true when workflow deleted", async () => {
    mockDb.delete.mockReturnValue(buildDeleteChain([{ id: "w1" }]));

    const { workflowServer } = await import("../workflow");
    const result = (await workflowServer.tools.archive.handler(
      { workflowId: "w1" },
      ctx,
    )) as { ok: boolean };

    expect(result.ok).toBe(true);
  });

  it("archive returns ok: false when workflow not found", async () => {
    mockDb.delete.mockReturnValue(buildDeleteChain([]));

    const { workflowServer } = await import("../workflow");
    const result = (await workflowServer.tools.archive.handler(
      { workflowId: "nonexistent" },
      ctx,
    )) as { ok: boolean };

    expect(result.ok).toBe(false);
  });
});
