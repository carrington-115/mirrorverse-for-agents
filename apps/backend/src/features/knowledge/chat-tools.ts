import { tool } from "ai";
import { z } from "zod";

import type { Database } from "@mirrorverse/db";

import * as repo from "./repo";
import { searchAcrossKnowledgeBases } from "./search";
import { knowledgeService } from "./service";

const MAX_ERROR_LENGTH = 300;

function safeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.slice(0, MAX_ERROR_LENGTH);
}

export function buildKnowledgeTools({
  db,
  workspaceId,
  userId,
  chatId,
  ragDocumentIds = [],
}: {
  readonly db: Database;
  readonly workspaceId: string;
  readonly userId: string;
  readonly chatId: string;
  // Document ids the user picked in the chat document UI to scope retrieval to.
  // Empty = search every accessible document.
  readonly ragDocumentIds?: readonly string[];
}) {
  const ctx = { db, workspaceId, userId };
  const view_knowledge_bases = tool({
    description: `Show the user's knowledge base documents in the chat — both the knowledge bases they created
in Mirrorverse and any files they uploaded during this chat session. Call this when the user asks to see, list,
find, or browse their documents/files, asks what is in their knowledge base, or asks about a specific document by
name. Also call it before creating a new knowledge base for an agent: it returns the user's existing knowledge bases
with their REAL ids and document counts, so you can reuse an existing knowledge base id (set knowledgeBaseIds in the
intent) instead of creating a duplicate and re-ingesting. Optionally filter by a search query or highlight a specific
document by id.`,
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe("Search term to filter documents by filename or source"),
      documentId: z
        .string()
        .optional()
        .describe("Specific document ID to highlight in the results"),
    }),
    // The card on the frontend fetches the document list itself (manual KBs +
    // this chat's uploads) keyed off chatSessionId, so the routing/filter hints
    // drive the card. We also return the accessible knowledge bases with real
    // ids + counts so the model can reuse an existing KB instead of recreating.
    execute: async ({ query, documentId }) => {
      const knowledgeBases = await repo
        .listChatAccessibleKbsWithCounts(db, workspaceId, chatId)
        .catch(() => []);
      return {
        ok: true,
        chatSessionId: chatId,
        query: query ?? null,
        documentId: documentId ?? null,
        knowledgeBases: knowledgeBases.map((kb) => ({
          knowledgeBaseId: kb.id,
          name: kb.name,
          documentCount: kb.documentCount,
          readyDocumentCount: kb.readyDocumentCount,
        })),
      };
    },
  });

  const hasDocSelection = ragDocumentIds.length > 0;
  const searchScopeNote = hasDocSelection
    ? " The user has selected specific documents to use, so this only searches those."
    : "";

  const search_knowledge_base = tool({
    description: `Search the user's knowledge bases for information relevant to their question. This covers the
documents they added to their knowledge bases plus any files they uploaded during this chat. Call this whenever the
user asks something that their own documents, files, PDFs, or notes might answer — before saying you don't know.
Returns the most relevant excerpts; cite the source filename when you use them.${searchScopeNote}`,
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe("What to look for in the user's documents"),
      topK: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe("How many excerpts to return (default 6)"),
    }),
    execute: async ({ query, topK }) => {
      const kbIds = await repo.listChatAccessibleKbIds(db, workspaceId, chatId);
      if (kbIds.length === 0) {
        return { ok: true, resultCount: 0, results: [] };
      }
      const hits = await searchAcrossKnowledgeBases(
        db,
        kbIds,
        query,
        topK ?? 6,
        undefined,
        hasDocSelection ? [...ragDocumentIds] : undefined,
      );
      return {
        ok: true,
        resultCount: hits.length,
        results: hits.map((h) => ({
          content: h.content,
          source: h.fileName ?? h.sourceUrl ?? "document",
          score: Number(h.score.toFixed(3)),
        })),
      };
    },
  });

  // ── Authoring tools (full-auto KB build) ─────────────────────────────────
  // Let Mirrorpilot create a knowledge base and ingest sources during the chat,
  // returning the REAL knowledgeBaseId so it can wire a RAG voice agent without
  // a placeholder.

  const create_knowledge_base = tool({
    description: `Create a new knowledge base to hold documents for retrieval (RAG). Call this when the user wants an
agent or assistant (e.g. a phone agent) that answers from their own documents, files, policies, pricing, or FAQs —
before ingesting anything. Returns the knowledgeBaseId; reuse that exact id when ingesting documents and when building
a voice agent that should search this knowledge base.`,
    inputSchema: z.object({
      name: z
        .string()
        .min(1)
        .max(200)
        .describe("Short name for the knowledge base, e.g. 'Product docs'"),
      description: z
        .string()
        .max(1000)
        .optional()
        .describe("Optional description of what it contains"),
    }),
    execute: async ({ name, description }) => {
      try {
        const existing = await repo.findChatAccessibleKbByName(
          db,
          workspaceId,
          chatId,
          name,
        );
        if (existing) {
          return {
            ok: true as const,
            knowledgeBaseId: existing.id,
            name: existing.name,
            note: `Knowledge base "${existing.name}" already exists — reusing it instead of creating a duplicate.`,
          };
        }
        const kb = await knowledgeService.createKb(ctx, {
          name,
          description,
          source: "manual",
          chatSessionId: chatId,
        });
        return { ok: true as const, knowledgeBaseId: kb.id, name: kb.name };
      } catch (err) {
        return { ok: false as const, error: safeError(err) };
      }
    },
  });

  const ingest_url = tool({
    description: `Add a web page to a knowledge base by URL. The page is fetched, its main text extracted, chunked, and
embedded for retrieval. Call after create_knowledge_base. Ingestion runs in the background — use kb_ingest_status to
check when it's ready.`,
    inputSchema: z.object({
      knowledgeBaseId: z
        .string()
        .min(1)
        .describe("The knowledgeBaseId returned by create_knowledge_base"),
      url: z.string().url().describe("Public URL of the page to ingest"),
    }),
    execute: async ({ knowledgeBaseId, url }) => {
      try {
        const doc = await knowledgeService.ingestDocument(ctx, {
          kbId: knowledgeBaseId,
          sourceType: "url",
          url,
        });
        return { ok: true as const, documentId: doc.id, status: doc.status };
      } catch (err) {
        return { ok: false as const, error: safeError(err) };
      }
    },
  });

  const ingest_text = tool({
    description: `Add pasted or freeform text to a knowledge base (e.g. an FAQ, return policy, or notes the user typed
into the chat). The text is chunked and embedded for retrieval. Call after create_knowledge_base.`,
    inputSchema: z.object({
      knowledgeBaseId: z
        .string()
        .min(1)
        .describe("The knowledgeBaseId returned by create_knowledge_base"),
      content: z
        .string()
        .min(1)
        .max(500_000)
        .describe("The text to store and make searchable"),
      fileName: z
        .string()
        .max(255)
        .optional()
        .describe("Optional label for the source, e.g. 'Return policy'"),
    }),
    execute: async ({ knowledgeBaseId, content, fileName }) => {
      try {
        const doc = await knowledgeService.ingestDocument(ctx, {
          kbId: knowledgeBaseId,
          sourceType: "text",
          content,
          fileName,
        });
        return { ok: true as const, documentId: doc.id, status: doc.status };
      } catch (err) {
        return { ok: false as const, error: safeError(err) };
      }
    },
  });

  const kb_ingest_status = tool({
    description: `Check whether the documents in a knowledge base have finished processing. Use this to tell the user
when their knowledge base is ready (all documents "ready") before relying on it.`,
    inputSchema: z.object({
      knowledgeBaseId: z
        .string()
        .min(1)
        .describe("The knowledgeBaseId returned by create_knowledge_base"),
    }),
    execute: async ({ knowledgeBaseId }) => {
      try {
        const docs = await knowledgeService.listDocuments(ctx, {
          kbId: knowledgeBaseId,
          limit: 100,
        });
        return {
          ok: true as const,
          documents: docs.map((d) => ({
            documentId: d.id,
            source: d.fileName ?? d.sourceUrl ?? d.sourceType,
            status: d.status,
            chunkCount: d.chunkCount,
          })),
        };
      } catch (err) {
        return { ok: false as const, error: safeError(err) };
      }
    },
  });

  return {
    view_knowledge_bases,
    search_knowledge_base,
    create_knowledge_base,
    ingest_url,
    ingest_text,
    kb_ingest_status,
  };
}
