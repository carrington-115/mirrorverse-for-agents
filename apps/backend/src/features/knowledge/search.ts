import type { Database } from "@mirrorverse/db";

import { embedQuery } from "./embed.js";
import * as repo from "./repo.js";

export interface KnowledgeSearchResult {
  chunkId: string;
  documentId: string;
  kbId: string;
  chunkIndex: number;
  content: string;
  score: number;
}

export async function searchKnowledgeBase(
  db: Database,
  kbId: string,
  query: string,
  topK: number,
  minScore?: number,
): Promise<KnowledgeSearchResult[]> {
  const queryEmbedding = await embedQuery(query);
  const chunks = await repo.searchChunks(
    db,
    kbId,
    queryEmbedding,
    topK,
    minScore,
  );
  return chunks.map((c) => ({
    chunkId: c.id,
    documentId: c.documentId,
    kbId: c.kbId,
    chunkIndex: c.chunkIndex,
    content: c.content,
    score: c.score,
  }));
}

export interface CrossKbSearchResult extends KnowledgeSearchResult {
  fileName: string | null;
  sourceUrl: string | null;
}

// Embeds the query once and searches the given knowledge bases together,
// returning the best-scoring chunks across all of them.
export async function searchAcrossKnowledgeBases(
  db: Database,
  kbIds: string[],
  query: string,
  topK: number,
  minScore?: number,
  documentIds?: string[],
): Promise<CrossKbSearchResult[]> {
  if (kbIds.length === 0) return [];
  const queryEmbedding = await embedQuery(query);
  const chunks = await repo.searchChunksAcrossKbs(
    db,
    kbIds,
    queryEmbedding,
    topK,
    minScore,
    documentIds,
  );
  return chunks.map((c) => ({
    chunkId: c.id,
    documentId: c.documentId,
    kbId: c.kbId,
    chunkIndex: c.chunkIndex,
    content: c.content,
    score: c.score,
    fileName: c.fileName,
    sourceUrl: c.sourceUrl,
  }));
}
