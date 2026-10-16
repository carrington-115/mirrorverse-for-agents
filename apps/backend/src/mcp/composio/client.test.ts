import type { Database } from "@mirrorverse/db";
import type { Redis } from "@upstash/redis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toolkitsGet = vi.hoisted(() => vi.fn());

vi.mock("@mirrorverse/env/backend", () => ({
  env: { NODE_ENV: "test", COMPOSIO_API_KEY: "test-key" },
}));
vi.mock("@mirrorverse/db", () => ({
  schema: { mcpServers: { id: "id", slug: "slug", workspaceId: "ws" } },
  and: vi.fn(),
  eq: vi.fn(),
  isNull: vi.fn(),
}));
vi.mock("@composio/core", () => ({
  Composio: class {
    toolkits = { get: toolkitsGet };
  },
  jsonSchemaToZodSchema: vi.fn(),
}));

import { setCacheClient } from "../../lib/cache";
import { getToolkitMetadata, lookupComposioMcpServerId } from "./client";

function fakeRedis() {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (k: string) => {
      const v = store.get(k);
      return v === undefined ? null : JSON.parse(v);
    }),
    set: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
      return "OK";
    }),
  };
}

function fakeDb(rows: { id: string }[]) {
  const limit = vi.fn(async () => rows);
  const db = {
    select: () => ({ from: () => ({ where: () => ({ limit }) }) }),
  };
  return { db: db as unknown as Database, limit };
}

beforeEach(() => {
  toolkitsGet.mockReset();
  setCacheClient(fakeRedis() as unknown as Redis);
});
afterEach(() => setCacheClient(null));

describe("lookupComposioMcpServerId", () => {
  it("caches the global Composio server id", async () => {
    const { db, limit } = fakeDb([{ id: "srv_1" }]);
    expect(await lookupComposioMcpServerId(db)).toBe("srv_1");
    expect(await lookupComposioMcpServerId(db)).toBe("srv_1");
    expect(limit).toHaveBeenCalledTimes(1);
  });

  it("does not cache a missing row", async () => {
    const { db, limit } = fakeDb([]);
    expect(await lookupComposioMcpServerId(db)).toBeNull();
    expect(await lookupComposioMcpServerId(db)).toBeNull();
    expect(limit).toHaveBeenCalledTimes(2);
  });
});

describe("getToolkitMetadata", () => {
  it("serves repeat lookups from the cache", async () => {
    toolkitsGet.mockResolvedValue({
      name: "GitHub",
      meta: { logo: "https://logo", description: "Code", toolsCount: 3 },
    });

    const first = await getToolkitMetadata(["github"]);
    const second = await getToolkitMetadata(["github"]);

    expect(toolkitsGet).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(first).toEqual([
      {
        slug: "github",
        name: "GitHub",
        logoUrl: "https://logo",
        description: "Code",
        toolsCount: 3,
      },
    ]);
  });

  it("drops toolkits whose lookup fails", async () => {
    toolkitsGet
      .mockResolvedValueOnce({ name: "Slack", meta: {} })
      .mockRejectedValueOnce(new Error("unknown toolkit"));

    const result = await getToolkitMetadata(["slack", "nope"]);
    expect(result.map((t) => t.slug)).toEqual(["slack"]);
  });
});
