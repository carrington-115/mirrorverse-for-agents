import { createHash } from "node:crypto";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  ne,
  or,
  schema,
  sql,
  type Database,
} from "@mirrorverse/db";

const { knowledgeBases, knowledgeDocuments, knowledgeChunks } = schema;

// ─── Knowledge Bases ──────────────────────────────────────────────────────────

export async function createKb(
  db: Database,
  workspaceId: string,
  userId: string,
  name: string,
  description: string | undefined,
  source: "manual" | "mirrorpilot" = "manual",
  chatSessionId?: string,
) {
  const [row] = await db
    .insert(knowledgeBases)
    .values({
      workspaceId,
      createdBy: userId,
      name,
      description,
      source,
      chatSessionId,
    })
    .returning();
  return row ?? null;
}

export async function getKbBySessionId(
  db: Database,
  chatSessionId: string,
  workspaceId: string,
) {
  const [row] = await db
    .select()
    .from(knowledgeBases)
    .where(
      and(
        eq(knowledgeBases.chatSessionId, chatSessionId),
        eq(knowledgeBases.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listKbs(
  db: Database,
  workspaceId: string,
  limit: number,
) {
  return db
    .select()
    .from(knowledgeBases)
    .where(eq(knowledgeBases.workspaceId, workspaceId))
    .orderBy(desc(knowledgeBases.updatedAt))
    .limit(limit);
}

// Returns the subset of the given KB ids that belong to the workspace. Used to
// re-validate ids baked into a deployed agent's config before searching, so a
// tampered/stale workflow document can't read another tenant's knowledge.
export async function filterKbIdsByWorkspace(
  db: Database,
  kbIds: string[],
  workspaceId: string,
): Promise<string[]> {
  if (kbIds.length === 0) return [];
  const rows = await db
    .select({ id: knowledgeBases.id })
    .from(knowledgeBases)
    .where(
      and(
        inArray(knowledgeBases.id, kbIds),
        eq(knowledgeBases.workspaceId, workspaceId),
      ),
    );
  return rows.map((r) => r.id);
}

// Returns the subset of the given document ids that belong to the workspace.
// Used to re-validate the document-scoping ids baked into a deployed agent's
// config before searching, so a tampered/stale workflow document can't scope to
// (or read) another tenant's documents.
export async function filterDocumentIdsByWorkspace(
  db: Database,
  documentIds: string[],
  workspaceId: string,
): Promise<string[]> {
  if (documentIds.length === 0) return [];
  const rows = await db
    .select({ id: knowledgeDocuments.id })
    .from(knowledgeDocuments)
    .where(
      and(
        inArray(knowledgeDocuments.id, documentIds),
        eq(knowledgeDocuments.workspaceId, workspaceId),
      ),
    );
  return rows.map((r) => r.id);
}

export async function getKb(db: Database, kbId: string, workspaceId: string) {
  const [row] = await db
    .select()
    .from(knowledgeBases)
    .where(
      and(
        eq(knowledgeBases.id, kbId),
        eq(knowledgeBases.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function deleteKb(
  db: Database,
  kbId: string,
  workspaceId: string,
): Promise<boolean> {
  const result = await db
    .delete(knowledgeBases)
    .where(
      and(
        eq(knowledgeBases.id, kbId),
        eq(knowledgeBases.workspaceId, workspaceId),
      ),
    )
    .returning({ id: knowledgeBases.id });
  return result.length > 0;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function createDocument(
  db: Database,
  values: {
    kbId: string;
    workspaceId: string;
    sourceType: "pdf" | "url" | "text" | "image" | "file";
    sourceUrl?: string;
    storageKey?: string;
    fileName?: string;
    contentHash?: string;
  },
) {
  const [row] = await db
    .insert(knowledgeDocuments)
    .values({ ...values, status: "pending" })
    .returning();
  return row ?? null;
}

export async function listDocuments(db: Database, kbId: string, limit: number) {
  return db
    .select()
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.kbId, kbId))
    .orderBy(asc(knowledgeDocuments.createdAt))
    .limit(limit);
}

// Knowledge bases a Mirrorpilot chat can see: every manually-created KB in the
// workspace plus the session's own upload bucket (source = "mirrorpilot" tied to
// this chat). Other chats' upload buckets are intentionally excluded.
const chatAccessibleKbWhere = (workspaceId: string, chatSessionId: string) =>
  and(
    eq(knowledgeBases.workspaceId, workspaceId),
    or(
      eq(knowledgeBases.source, "manual"),
      eq(knowledgeBases.chatSessionId, chatSessionId),
    ),
  );

export async function listChatAccessibleDocuments(
  db: Database,
  workspaceId: string,
  chatSessionId: string,
  limit: number,
) {
  return db
    .select({
      id: knowledgeDocuments.id,
      kbId: knowledgeDocuments.kbId,
      kbName: knowledgeBases.name,
      kbSource: knowledgeBases.source,
      sourceType: knowledgeDocuments.sourceType,
      sourceUrl: knowledgeDocuments.sourceUrl,
      fileName: knowledgeDocuments.fileName,
      status: knowledgeDocuments.status,
      chunkCount: knowledgeDocuments.chunkCount,
      createdAt: knowledgeDocuments.createdAt,
    })
    .from(knowledgeDocuments)
    .innerJoin(knowledgeBases, eq(knowledgeDocuments.kbId, knowledgeBases.id))
    .where(chatAccessibleKbWhere(workspaceId, chatSessionId))
    .orderBy(asc(knowledgeBases.name), asc(knowledgeDocuments.createdAt))
    .limit(limit);
}

export async function listChatAccessibleKbIds(
  db: Database,
  workspaceId: string,
  chatSessionId: string,
): Promise<string[]> {
  const rows = await db
    .select({ id: knowledgeBases.id })
    .from(knowledgeBases)
    .where(chatAccessibleKbWhere(workspaceId, chatSessionId));
  return rows.map((r) => r.id);
}

export interface ChatAccessibleKb {
  id: string;
  name: string;
  description: string | null;
  source: "manual" | "mirrorpilot";
  documentCount: number;
  readyDocumentCount: number;
}

// Existing knowledge bases a chat can reuse, with document counts so Mirrorpilot
// can pick one to bind to an agent instead of creating a new KB and re-ingesting.
export async function listChatAccessibleKbsWithCounts(
  db: Database,
  workspaceId: string,
  chatSessionId: string,
): Promise<ChatAccessibleKb[]> {
  const rows = await db
    .select({
      id: knowledgeBases.id,
      name: knowledgeBases.name,
      description: knowledgeBases.description,
      source: knowledgeBases.source,
      documentCount: sql<number>`count(${knowledgeDocuments.id})::int`,
      readyDocumentCount: sql<number>`(count(${knowledgeDocuments.id}) filter (where ${knowledgeDocuments.status} = 'ready'))::int`,
    })
    .from(knowledgeBases)
    .leftJoin(
      knowledgeDocuments,
      eq(knowledgeDocuments.kbId, knowledgeBases.id),
    )
    .where(chatAccessibleKbWhere(workspaceId, chatSessionId))
    .groupBy(knowledgeBases.id)
    .orderBy(asc(knowledgeBases.name));
  return rows;
}

export interface ResolvedSelectedDocument {
  documentId: string;
  kbId: string;
  kbName: string;
  fileName: string | null;
  sourceUrl: string | null;
  status: string;
}

// Resolve the document ids the user picked in the chat to their owning knowledge
// bases, scoped to the workspace so a stale or tampered id can never reveal
// another tenant's KB. Used to let Mirrorpilot reuse the existing KB id(s) for
// those documents instead of creating a brand-new knowledge base.
export async function resolveSelectedDocumentKbs(
  db: Database,
  workspaceId: string,
  documentIds: string[],
): Promise<ResolvedSelectedDocument[]> {
  if (documentIds.length === 0) return [];
  return db
    .select({
      documentId: knowledgeDocuments.id,
      kbId: knowledgeDocuments.kbId,
      kbName: knowledgeBases.name,
      fileName: knowledgeDocuments.fileName,
      sourceUrl: knowledgeDocuments.sourceUrl,
      status: knowledgeDocuments.status,
    })
    .from(knowledgeDocuments)
    .innerJoin(knowledgeBases, eq(knowledgeDocuments.kbId, knowledgeBases.id))
    .where(
      and(
        inArray(knowledgeDocuments.id, documentIds),
        eq(knowledgeDocuments.workspaceId, workspaceId),
      ),
    );
}

export async function getDocument(
  db: Database,
  documentId: string,
  workspaceId: string,
) {
  const [row] = await db
    .select()
    .from(knowledgeDocuments)
    .where(
      and(
        eq(knowledgeDocuments.id, documentId),
        eq(knowledgeDocuments.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function updateDocumentStatus(
  db: Database,
  documentId: string,
  status: "processing" | "ready" | "failed",
  extras: {
    chunkCount?: number;
    errorMessage?: string;
    contentHash?: string;
  } = {},
) {
  await db
    .update(knowledgeDocuments)
    .set({ status, ...extras })
    .where(eq(knowledgeDocuments.id, documentId));
}

// Finds an already-ingested ("ready") document in the same KB with the same
// content hash, excluding the document currently being processed. Used to make
// ingestion idempotent: re-ingesting identical content skips re-embedding.
export async function findReadyDocByHash(
  db: Database,
  kbId: string,
  contentHash: string,
  excludeDocumentId: string,
) {
  const [row] = await db
    .select()
    .from(knowledgeDocuments)
    .where(
      and(
        eq(knowledgeDocuments.kbId, kbId),
        eq(knowledgeDocuments.contentHash, contentHash),
        eq(knowledgeDocuments.status, "ready"),
        ne(knowledgeDocuments.id, excludeDocumentId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function deleteDocument(
  db: Database,
  documentId: string,
  workspaceId: string,
): Promise<boolean> {
  const result = await db
    .delete(knowledgeDocuments)
    .where(
      and(
        eq(knowledgeDocuments.id, documentId),
        eq(knowledgeDocuments.workspaceId, workspaceId),
      ),
    )
    .returning({ id: knowledgeDocuments.id });
  return result.length > 0;
}

// ─── Chunks ───────────────────────────────────────────────────────────────────

export interface ChunkInsert {
  documentId: string;
  kbId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  embedding: number[];
}

export async function upsertChunks(db: Database, chunks: ChunkInsert[]) {
  if (chunks.length === 0) return;
  await db
    .insert(knowledgeChunks)
    .values(chunks)
    .onConflictDoUpdate({
      target: [knowledgeChunks.documentId, knowledgeChunks.chunkIndex],
      set: {
        content: sql`excluded.content`,
        tokenCount: sql`excluded.token_count`,
        embedding: sql`excluded.embedding`,
      },
    });
}

export interface ChunkSearchResult {
  id: string;
  documentId: string;
  kbId: string;
  chunkIndex: number;
  content: string;
  score: number;
}

export async function searchChunks(
  db: Database,
  kbId: string,
  queryEmbedding: number[],
  topK: number,
  minScore?: number,
): Promise<ChunkSearchResult[]> {
  // Pass the embedding as a parameterized text value and cast to vector.
  // Drizzle interpolates the string as $N, postgres casts it: '$N'::vector.
  const vecStr = `[${queryEmbedding.join(",")}]`;
  const rows = await db
    .select({
      id: knowledgeChunks.id,
      documentId: knowledgeChunks.documentId,
      kbId: knowledgeChunks.kbId,
      chunkIndex: knowledgeChunks.chunkIndex,
      content: knowledgeChunks.content,
      score: sql<number>`1 - (${knowledgeChunks.embedding} <=> ${vecStr}::vector)`,
    })
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.kbId, kbId))
    .orderBy(sql`${knowledgeChunks.embedding} <=> ${vecStr}::vector`)
    .limit(topK);

  if (minScore !== undefined) {
    return rows.filter((r) => r.score >= minScore);
  }
  return rows;
}

export interface CrossKbChunkResult extends ChunkSearchResult {
  fileName: string | null;
  sourceUrl: string | null;
}

export async function searchChunksAcrossKbs(
  db: Database,
  kbIds: string[],
  queryEmbedding: number[],
  topK: number,
  minScore?: number,
  // When non-empty, restrict the search to these specific documents (the docs
  // the user picked in the chat) rather than every doc in the accessible KBs.
  documentIds?: string[],
): Promise<CrossKbChunkResult[]> {
  if (kbIds.length === 0) return [];
  const vecStr = `[${queryEmbedding.join(",")}]`;
  const scopeToDocs = documentIds && documentIds.length > 0;
  const rows = await db
    .select({
      id: knowledgeChunks.id,
      documentId: knowledgeChunks.documentId,
      kbId: knowledgeChunks.kbId,
      chunkIndex: knowledgeChunks.chunkIndex,
      content: knowledgeChunks.content,
      fileName: knowledgeDocuments.fileName,
      sourceUrl: knowledgeDocuments.sourceUrl,
      score: sql<number>`1 - (${knowledgeChunks.embedding} <=> ${vecStr}::vector)`,
    })
    .from(knowledgeChunks)
    .innerJoin(
      knowledgeDocuments,
      eq(knowledgeChunks.documentId, knowledgeDocuments.id),
    )
    .where(
      scopeToDocs
        ? and(
            inArray(knowledgeChunks.kbId, kbIds),
            inArray(knowledgeChunks.documentId, documentIds),
          )
        : inArray(knowledgeChunks.kbId, kbIds),
    )
    .orderBy(sql`${knowledgeChunks.embedding} <=> ${vecStr}::vector`)
    .limit(topK);

  if (minScore !== undefined) {
    return rows.filter((r) => r.score >= minScore);
  }
  return rows;
}

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
