import type { Database } from "@mirrorverse/db";

import { appError, ErrCode } from "../../lib/errors.js";
import {
  createSignedStorageUrl,
  createSignedUploadUrl,
} from "../../lib/storage.js";
import { inngest } from "../inngest/client.js";
import { knowledgeIngestEvent } from "../inngest/events.js";
import * as repo from "./repo.js";
import { searchKnowledgeBase } from "./search.js";
import type {
  CreateKbInput,
  DeleteDocumentInput,
  DeleteKbInput,
  GetKbInput,
  GetOrCreateSessionKbInput,
  IngestDocumentInput,
  ListChatDocumentsInput,
  ListDocumentsInput,
  ListKbsInput,
  SearchKbInput,
  SignUploadUrlInput,
} from "./inputs.js";

interface WorkspaceCtx {
  readonly db: Database;
  readonly workspaceId: string;
  readonly userId: string;
}

export const knowledgeService = {
  async createKb(ctx: WorkspaceCtx, input: CreateKbInput) {
    const kb = await repo.createKb(
      ctx.db,
      ctx.workspaceId,
      ctx.userId,
      input.name,
      input.description,
      input.source ?? "manual",
      input.chatSessionId,
    );
    if (!kb)
      throw appError(ErrCode.Internal, "Failed to create knowledge base");
    return kb;
  },

  async getOrCreateSessionKb(
    ctx: WorkspaceCtx,
    input: GetOrCreateSessionKbInput,
  ) {
    const existing = await repo.getKbBySessionId(
      ctx.db,
      input.chatSessionId,
      ctx.workspaceId,
    );
    if (existing) return existing;
    const kb = await repo.createKb(
      ctx.db,
      ctx.workspaceId,
      ctx.userId,
      input.name,
      undefined,
      "mirrorpilot",
      input.chatSessionId,
    );
    if (!kb)
      throw appError(ErrCode.Internal, "Failed to create knowledge base");
    return kb;
  },

  async listKbs(ctx: WorkspaceCtx, input: ListKbsInput) {
    return repo.listKbs(ctx.db, ctx.workspaceId, input.limit);
  },

  async getKb(ctx: WorkspaceCtx, input: GetKbInput) {
    const kb = await repo.getKb(ctx.db, input.kbId, ctx.workspaceId);
    if (!kb) throw appError(ErrCode.NotFound, "Knowledge base not found");
    return kb;
  },

  async deleteKb(ctx: WorkspaceCtx, input: DeleteKbInput) {
    const ok = await repo.deleteKb(ctx.db, input.kbId, ctx.workspaceId);
    if (!ok) throw appError(ErrCode.NotFound, "Knowledge base not found");
    return { id: input.kbId };
  },

  async ingestDocument(ctx: WorkspaceCtx, input: IngestDocumentInput) {
    const kb = await repo.getKb(ctx.db, input.kbId, ctx.workspaceId);
    if (!kb) throw appError(ErrCode.NotFound, "Knowledge base not found");

    const docValues: Parameters<typeof repo.createDocument>[1] = {
      kbId: input.kbId,
      workspaceId: ctx.workspaceId,
      sourceType: input.sourceType,
      fileName: input.fileName,
    };

    if (input.sourceType === "url") {
      docValues.sourceUrl = input.url;
    } else if (
      input.sourceType === "pdf" ||
      input.sourceType === "image" ||
      input.sourceType === "file"
    ) {
      docValues.storageKey = input.storageKey;
    }

    const doc = await repo.createDocument(ctx.db, docValues);
    if (!doc) throw appError(ErrCode.Internal, "Failed to create document");

    // For bucket-backed docs the storageKey is a private Supabase Storage path —
    // Inngest needs a real HTTP URL to fetch it, so we sign a 24-hour URL now.
    let contentOrUrl: string;
    if (input.sourceType === "text") {
      contentOrUrl = input.content;
    } else if (input.sourceType === "url") {
      contentOrUrl = input.url;
    } else {
      contentOrUrl = await createSignedStorageUrl(
        "knowledge-base",
        input.storageKey,
      );
    }

    // mediaType is only present on "image"/"file"; it tells the worker which
    // parser to run (vision OCR, docx, xlsx, plain text, …).
    const mediaType =
      input.sourceType === "image" || input.sourceType === "file"
        ? input.mediaType
        : undefined;

    await inngest.send(
      knowledgeIngestEvent.create({
        documentId: doc.id,
        kbId: input.kbId,
        workspaceId: ctx.workspaceId,
        sourceType: input.sourceType,
        contentOrUrl,
        mediaType,
        fileName: input.fileName,
      }),
    );

    return doc;
  },

  async listDocuments(ctx: WorkspaceCtx, input: ListDocumentsInput) {
    const kb = await repo.getKb(ctx.db, input.kbId, ctx.workspaceId);
    if (!kb) throw appError(ErrCode.NotFound, "Knowledge base not found");
    return repo.listDocuments(ctx.db, input.kbId, input.limit);
  },

  async listChatDocuments(ctx: WorkspaceCtx, input: ListChatDocumentsInput) {
    return repo.listChatAccessibleDocuments(
      ctx.db,
      ctx.workspaceId,
      input.chatSessionId,
      input.limit,
    );
  },

  async deleteDocument(ctx: WorkspaceCtx, input: DeleteDocumentInput) {
    const ok = await repo.deleteDocument(
      ctx.db,
      input.documentId,
      ctx.workspaceId,
    );
    if (!ok) throw appError(ErrCode.NotFound, "Document not found");
    return { id: input.documentId };
  },

  async signUploadUrl(_ctx: WorkspaceCtx, input: SignUploadUrlInput) {
    const uploadUrl = await createSignedUploadUrl(
      "knowledge-base",
      input.storageKey,
    );
    return { uploadUrl };
  },

  async searchKb(ctx: WorkspaceCtx, input: SearchKbInput) {
    const kb = await repo.getKb(ctx.db, input.kbId, ctx.workspaceId);
    if (!kb) throw appError(ErrCode.NotFound, "Knowledge base not found");
    return searchKnowledgeBase(
      ctx.db,
      input.kbId,
      input.query,
      input.topK,
      input.minScore,
    );
  },
};
