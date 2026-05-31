import { router } from "../../trpc/init.js";
// Every chat op runs under workspaceProc so it executes inside the tenant
// transaction (RLS-scoped). Queries still filter by userId; the workspace GUC
// is a defense-in-depth backstop.
import { workspaceProc } from "../../trpc/middleware.js";

import {
  appendUserMessageInput,
  deleteChatInput,
  deleteLastAssistantInput,
  editAndTruncateInput,
  editUserMessageInput,
  ensureChatInput,
  getChatInput,
  getPendingInterruptInput,
  listChatsInput,
  pinChatInput,
} from "./inputs.js";
import { chatsService } from "./service.js";

export const chatsRouter = router({
  list: workspaceProc
    .input(listChatsInput)
    .query(({ ctx, input }) =>
      chatsService.list({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  get: workspaceProc
    .input(getChatInput)
    .query(({ ctx, input }) =>
      chatsService.getChat({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  ensure: workspaceProc
    .input(ensureChatInput)
    .mutation(({ ctx, input }) =>
      chatsService.ensureChat(
        { db: ctx.db, userId: ctx.user.id, workspaceId: ctx.workspaceId },
        input,
      ),
    ),

  appendUserMessage: workspaceProc
    .input(appendUserMessageInput)
    .mutation(({ ctx, input }) =>
      chatsService.appendUserMessage(
        { db: ctx.db, userId: ctx.user.id },
        input,
      ),
    ),

  editUserMessage: workspaceProc
    .input(editUserMessageInput)
    .mutation(({ ctx, input }) =>
      chatsService.editUserMessage({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  editAndTruncate: workspaceProc
    .input(editAndTruncateInput)
    .mutation(({ ctx, input }) =>
      chatsService.editAndTruncate({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  deleteLastAssistant: workspaceProc
    .input(deleteLastAssistantInput)
    .mutation(({ ctx, input }) =>
      chatsService.deleteLastAssistant(
        { db: ctx.db, userId: ctx.user.id },
        input,
      ),
    ),

  delete: workspaceProc
    .input(deleteChatInput)
    .mutation(({ ctx, input }) =>
      chatsService.deleteChat({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  pin: workspaceProc
    .input(pinChatInput)
    .mutation(({ ctx, input }) =>
      chatsService.pinChat({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  pendingInterrupt: workspaceProc
    .input(getPendingInterruptInput)
    .query(({ ctx, input }) =>
      chatsService.getPendingInterrupt(
        { db: ctx.db, userId: ctx.user.id },
        input.chatId,
      ),
    ),
});
