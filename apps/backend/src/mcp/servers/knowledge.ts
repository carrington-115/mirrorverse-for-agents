import { z } from "zod";

import { searchKnowledgeBase } from "../../features/knowledge/search";
import type { FirstPartyServer } from "../server-host";

export const knowledgeServer: FirstPartyServer = {
  id: "first_party.knowledge",
  tools: {
    search: {
      description:
        "Search a knowledge base using semantic similarity (RAG). " +
        "Returns the top-k most relevant chunks with their content and relevance score.",
      inputSchema: z.object({
        kbId: z.string().min(1).describe("Knowledge base ID to search"),
        query: z.string().min(1).describe("Natural language query"),
        topK: z.number().int().min(1).max(20).default(5),
        minScore: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe(
            "Minimum similarity score to include (0–1). Omit for no threshold.",
          ),
      }),
      async handler(
        {
          kbId,
          query,
          topK,
          minScore,
        }: { kbId: string; query: string; topK: number; minScore?: number },
        ctx,
      ) {
        const results = await searchKnowledgeBase(
          ctx.db,
          kbId,
          query,
          topK,
          minScore,
        );
        return { results };
      },
    },
  },
};
