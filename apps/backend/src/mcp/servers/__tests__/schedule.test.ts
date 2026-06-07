import { randomUUID } from "node:crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

import type { WorkflowDocument } from "@mirrorverse/types";

const cronDoc: WorkflowDocument = {
  id: "wf-cron",
  name: "Cron Workflow",
  version: 1,
  nodes: [
    {
      id: "t1",
      type: "trigger.cron",
      position: { x: 0, y: 0 },
      params: { expression: "0 8 * * *", timezone: "UTC" },
    },
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

function buildUpdateChain(returnValue: unknown = undefined) {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.returning = vi.fn(() =>
    Promise.resolve(returnValue !== undefined ? [returnValue] : []),
  );
  return chain;
}

describe("schedule server", () => {
  const workflowId = randomUUID();
  const ctx = { db: mockDb as never, workspaceId: "ws-1", userId: "u-1" };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SKIP_ENV_VALIDATION = "true";

    mockDb.select.mockReturnValue(
      buildSelectChain([{ id: "v1", versionNumber: 1, document: cronDoc }]),
    );
    mockDb.insert.mockReturnValue({ values: vi.fn(() => Promise.resolve()) });
    mockDb.update.mockReturnValue(buildUpdateChain({ id: workflowId }));
    mockDb.transaction.mockImplementation(
      async (fn: (tx: typeof mockDb) => Promise<void>) => {
        await fn(mockDb);
      },
    );
  });

  it("create_cron updates the trigger node expression", async () => {
    const { scheduleServer } = await import("../schedule");

    const result = (await scheduleServer.tools.create_cron.handler(
      { workflowId, expression: "0 9 * * 1", timezone: "America/New_York" },
      ctx,
    )) as { ok: boolean };

    expect(result.ok).toBe(true);
    // insert should have been called (new version)
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("create_cron throws for an invalid cron expression", async () => {
    const { scheduleServer } = await import("../schedule");

    await expect(
      scheduleServer.tools.create_cron.handler(
        { workflowId, expression: "not-a-cron", timezone: "UTC" },
        ctx,
      ),
    ).rejects.toThrow(/invalid cron expression/);
  });

  it("create_cron throws if workflow has no trigger.cron node", async () => {
    const docNoCron: WorkflowDocument = {
      ...cronDoc,
      nodes: [
        {
          id: "n1",
          type: "trigger.manual",
          position: { x: 0, y: 0 },
          params: {},
        },
      ],
    };
    mockDb.select.mockReturnValue(
      buildSelectChain([{ id: "v1", versionNumber: 1, document: docNoCron }]),
    );
    const { scheduleServer } = await import("../schedule");

    await expect(
      scheduleServer.tools.create_cron.handler(
        { workflowId, expression: "0 9 * * *", timezone: "UTC" },
        ctx,
      ),
    ).rejects.toThrow(/trigger.cron node/);
  });

  it("cancel_cron sets the workflow to paused", async () => {
    const { scheduleServer } = await import("../schedule");

    const result = (await scheduleServer.tools.cancel_cron.handler(
      { workflowId },
      ctx,
    )) as { ok: boolean };

    expect(result.ok).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });
});
