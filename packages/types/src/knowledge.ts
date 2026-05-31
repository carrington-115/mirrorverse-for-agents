import type {
  JsonObject,
  KnowledgeBaseId,
  KnowledgeChunkId,
  KnowledgeDocumentId,
  Tenanted,
  Timestamps,
  Tokens,
  UserId,
} from "./common";

/** A retrievable corpus the agent and workflow nodes can search over. */
export interface KnowledgeBase extends Timestamps, Tenanted {
  readonly id: KnowledgeBaseId;
  readonly name: string;
  readonly description: string | null;
  readonly embeddingModel: string;
  readonly chunkSize: number;
  readonly chunkOverlap: number;
  readonly documentCount: number;
  readonly chunkCount: number;
  readonly createdBy: UserId;
}

export type KnowledgeDocumentSourceKind =
  | "upload"
  | "url"
  | "text"
  | "google_drive"
  | "notion"
  | "webhook";

export type KnowledgeDocumentStatus = "pending" | "processing" | "indexed" | "failed";

export interface KnowledgeDocument extends Timestamps, Tenanted {
  readonly id: KnowledgeDocumentId;
  readonly knowledgeBaseId: KnowledgeBaseId;
  readonly sourceKind: KnowledgeDocumentSourceKind;
  readonly sourceUri: string | null;
  readonly title: string;
  readonly contentHash: string;
  readonly mimeType: string | null;
  readonly sizeBytes: number;
  readonly status: KnowledgeDocumentStatus;
  readonly statusReason: string | null;
  readonly lastIndexedAt: Date | null;
  readonly metadata: JsonObject;
}

/**
 * Retrievable chunk. The vector itself lives in pgvector; we surface only
 * the dimensionality so clients know the embedding space.
 */
export interface KnowledgeChunk {
  readonly id: KnowledgeChunkId;
  readonly documentId: KnowledgeDocumentId;
  readonly knowledgeBaseId: KnowledgeBaseId;
  readonly index: number;
  readonly content: string;
  readonly tokens: Tokens;
  readonly embeddingDim: number;
  readonly metadata: JsonObject;
}
