import { router } from "../../trpc/init";
import { protectedProc } from "../../trpc/middleware";

import {
  appendUserMessageInput,
  editUserMessageInput,
  ensureChatInput,
  getChatInput,
  listChatsInput,
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

  ensure: protectedProc
    .input(ensureChatInput)
    .mutation(({ ctx, input }) =>
      chatsService.ensureChat({ db: ctx.db, userId: ctx.user.id }, input),
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
});
