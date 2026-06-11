import { router, TRPCError } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";
import { getActiveSubscription } from "../billing/repo";

import {
  createKbInput,
  deleteDocumentInput,
  deleteKbInput,
  getKbInput,
  getOrCreateSessionKbInput,
  ingestDocumentInput,
  listChatDocumentsInput,
  listDocumentsInput,
  listKbsInput,
  searchKbInput,
  signUploadUrlInput,
} from "./inputs";
import { knowledgeService } from "./service";

export const knowledgeRouter = router({
  createKb: workspaceProc
    .input(createKbInput)
    .mutation(({ ctx, input }) =>
      knowledgeService.createKb(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  listKbs: workspaceProc
    .input(listKbsInput)
    .query(({ ctx, input }) =>
      knowledgeService.listKbs(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  getKb: workspaceProc
    .input(getKbInput)
    .query(({ ctx, input }) =>
      knowledgeService.getKb(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  deleteKb: workspaceProc
    .input(deleteKbInput)
    .mutation(({ ctx, input }) =>
      knowledgeService.deleteKb(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  ingest: workspaceProc
    .input(ingestDocumentInput)
    .mutation(({ ctx, input }) =>
      knowledgeService.ingestDocument(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  listDocuments: workspaceProc
    .input(listDocumentsInput)
    .query(({ ctx, input }) =>
      knowledgeService.listDocuments(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  listChatDocuments: workspaceProc
    .input(listChatDocumentsInput)
    .query(({ ctx, input }) =>
      knowledgeService.listChatDocuments(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  deleteDocument: workspaceProc
    .input(deleteDocumentInput)
    .mutation(({ ctx, input }) =>
      knowledgeService.deleteDocument(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  getOrCreateSessionKb: workspaceProc
    .input(getOrCreateSessionKbInput)
    .mutation(({ ctx, input }) =>
      knowledgeService.getOrCreateSessionKb(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  search: workspaceProc
    .input(searchKbInput)
    .query(({ ctx, input }) =>
      knowledgeService.searchKb(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      ),
    ),

  signUploadUrl: workspaceProc
    .input(signUploadUrlInput)
    .mutation(async ({ ctx, input }) => {
      if (input.fileSizeMb !== undefined) {
        const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);
        const limit = sub?.plan.limits.maxFileUploadMb ?? null;
        if (limit !== null && input.fileSizeMb > limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `File exceeds the ${limit} MB upload limit for your plan. Please upgrade.`,
          });
        }
      }
      return knowledgeService.signUploadUrl(
        { db: ctx.db, workspaceId: ctx.workspaceId, userId: ctx.user.id },
        input,
      );
    }),
});
