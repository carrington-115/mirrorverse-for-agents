import { sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { activeWorkspaceSql, tenantPolicy, transitivePolicy } from "./rls.js";
import { workspaces } from "./tenancy.schema.js";

// pgvector column — stored as "[0.1,0.2,...]" string by the driver
const embeddingVector = customType<{ data: number[]; driverData: string }>({
  dataType: () => "vector(1536)",
  fromDriver: (v: string) => v.slice(1, -1).split(",").map(Number),
  toDriver: (v: number[]) => `[${v.join(",")}]`,
});

export type KnowledgeDocumentSourceType = "pdf" | "url" | "text" | "image" | "file";
export type KnowledgeDocumentStatus = "pending" | "processing" | "ready" | "failed";

export type KnowledgeBaseSource = "manual" | "mirrorpilot";

export const knowledgeBases = pgTable(
  "knowledge_bases",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdBy: text("created_by").notNull(),
    source: text("source").$type<KnowledgeBaseSource>().notNull().default("manual"),
    chatSessionId: text("chat_session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("knowledge_bases_workspace_idx").on(t.workspaceId),
    index("knowledge_bases_session_idx").on(t.chatSessionId),
    tenantPolicy("knowledge_bases"),
  ],
);

export const knowledgeDocuments = pgTable(
  "knowledge_documents",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    kbId: text("kb_id")
      .notNull()
      .references(() => knowledgeBases.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceType: text("source_type").$type<KnowledgeDocumentSourceType>().notNull(),
    sourceUrl: text("source_url"),
    storageKey: text("storage_key"),
    fileName: text("file_name"),
    status: text("status").$type<KnowledgeDocumentStatus>().notNull().default("pending"),
    contentHash: text("content_hash"),
    errorMessage: text("error_message"),
    chunkCount: integer("chunk_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("knowledge_documents_kb_idx").on(t.kbId),
    index("knowledge_documents_workspace_idx").on(t.workspaceId),
    tenantPolicy("knowledge_documents"),
  ],
);

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    documentId: text("document_id")
      .notNull()
      .references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
    kbId: text("kb_id")
      .notNull()
      .references(() => knowledgeBases.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count").notNull().default(0),
    embedding: embeddingVector("embedding").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("knowledge_chunks_doc_chunk_idx").on(t.documentId, t.chunkIndex),
    index("knowledge_chunks_kb_idx").on(t.kbId),
    // HNSW index on `embedding` is created in migration 0007_knowledge_hnsw.sql
    // (drizzle-kit can't generate vector indexes, so it's hand-written there).
    // No workspace_id of its own — scoped through the parent knowledge base.
    transitivePolicy(
      "knowledge_chunks",
      sql`exists (select 1 from knowledge_bases where knowledge_bases.id = knowledge_chunks.kb_id and knowledge_bases.workspace_id = ${activeWorkspaceSql})`,
    ),
  ],
);
