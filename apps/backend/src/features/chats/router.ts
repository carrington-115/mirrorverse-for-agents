import { router } from "../../trpc/init";
import { protectedProc, workspaceProc } from "../../trpc/middleware";

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
} from "./inputs";
import { chatsService } from "./service";

export const chatsRouter = router({
  list: protectedProc
    .input(listChatsInput)
    .query(({ ctx, input }) =>
      chatsService.list({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  get: protectedProc
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

  appendUserMessage: protectedProc
    .input(appendUserMessageInput)
    .mutation(({ ctx, input }) =>
      chatsService.appendUserMessage(
        { db: ctx.db, userId: ctx.user.id },
        input,
      ),
    ),

  editUserMessage: protectedProc
    .input(editUserMessageInput)
    .mutation(({ ctx, input }) =>
      chatsService.editUserMessage({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  editAndTruncate: protectedProc
    .input(editAndTruncateInput)
    .mutation(({ ctx, input }) =>
      chatsService.editAndTruncate({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  deleteLastAssistant: protectedProc
    .input(deleteLastAssistantInput)
    .mutation(({ ctx, input }) =>
      chatsService.deleteLastAssistant(
        { db: ctx.db, userId: ctx.user.id },
        input,
      ),
    ),

  delete: protectedProc
    .input(deleteChatInput)
    .mutation(({ ctx, input }) =>
      chatsService.deleteChat({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  pin: protectedProc
    .input(pinChatInput)
    .mutation(({ ctx, input }) =>
      chatsService.pinChat({ db: ctx.db, userId: ctx.user.id }, input),
    ),

  pendingInterrupt: protectedProc
    .input(getPendingInterruptInput)
    .query(({ ctx, input }) =>
      chatsService.getPendingInterrupt(
        { db: ctx.db, userId: ctx.user.id },
        input.chatId,
      ),
    ),
});
