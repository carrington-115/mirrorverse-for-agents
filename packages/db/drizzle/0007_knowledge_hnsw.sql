-- 0007: HNSW index on knowledge_chunks.embedding for fast cosine search.
--
-- pgvector exact search (sequential scan) is correct but O(rows); this index
-- powers approximate nearest-neighbour lookups used by repo.searchChunks /
-- searchChunksAcrossKbs, which order by the cosine distance operator (<=>).
-- vector_cosine_ops matches that operator. Requires pgvector >= 0.5 (HNSW);
-- fall back to ivfflat if the deployment pins an older pgvector.
--
-- Additive and idempotent; safe to run on populated DBs. Plain CREATE INDEX
-- (not CONCURRENTLY) because drizzle wraps migrations in a transaction and the
-- table is new/small.

CREATE INDEX IF NOT EXISTS "knowledge_chunks_embedding_hnsw_idx"
  ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);
