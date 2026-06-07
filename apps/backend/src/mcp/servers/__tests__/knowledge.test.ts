import { describe, expect, it, vi } from "vitest";

vi.mock("../../../features/knowledge/search", () => ({
  searchKnowledgeBase: vi.fn(async () => [
    {
      chunkId: "c1",
      documentId: "d1",
      kbId: "kb1",
      chunkIndex: 0,
      content: "chunk content",
      score: 0.9,
    },
  ]),
}));

describe("knowledge server", () => {
  it("search delegates to searchKnowledgeBase and returns results", async () => {
    process.env.SKIP_ENV_VALIDATION = "true";
    const { knowledgeServer } = await import("../knowledge");
    const { searchKnowledgeBase } =
      await import("../../../features/knowledge/search");

    const ctx = { db: {} as never, workspaceId: "ws-1", userId: "u-1" };
    const result = (await knowledgeServer.tools.search.handler(
      { kbId: "kb1", query: "what is X?", topK: 5 },
      ctx,
    )) as { results: Array<{ content: string; score: number }> };

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.content).toBe("chunk content");
    expect(searchKnowledgeBase).toHaveBeenCalledWith(
      ctx.db,
      "kb1",
      "what is X?",
      5,
      undefined,
    );
  });
});
