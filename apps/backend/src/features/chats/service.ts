import {
  checkChatLimits,
  type ChatLimitBreach,
  type ChatLimits,
} from "@mirrorverse/agent";
import type { Database } from "@mirrorverse/db";
import type { ContentBlock, UserId } from "@mirrorverse/types";

import { appError, ErrCode } from "../../lib/errors";
import { getChatTotalCostCents } from "../billing/repo";
import { ensureUserWorkspace } from "../tenancy/repo";

import * as repo from "./repo";
import type {
  AppendUserMessageInput,
  DeleteChatInput,
  EditUserMessageInput,
  EnsureChatInput,
  GetChatInput,
  ListChatsInput,
} from "./inputs";

interface BaseCtx {
  readonly db: Database;
  readonly userId: UserId;
}

export interface CheckAdmissionInput {
  readonly chatId: string;
  readonly limits: ChatLimits;
}

function echoReply(
  blocks: readonly { type: "text"; text: string }[],
): ContentBlock[] {
  const userText = blocks
    .map((b) => b.text)
    .join("\n\n")
    .trim();
  return [
    {
      type: "text",
      text: `Echo: ${userText}\n\n(The orchestrator agent isn't wired up yet — replies are placeholder.)`,
    } as ContentBlock,
  ];
}

export const chatsService = {
  async ensureChat(ctx: BaseCtx, input: EnsureChatInput) {
    const workspaceId = await ensureUserWorkspace(ctx.db, ctx.userId);
    const chat = await repo.ensureChat(ctx.db, {
      chatId: input.chatId,
      workspaceId,
      userId: ctx.userId,
      title: input.title,
    });
    if (!chat) throw appError(ErrCode.Internal, "Failed to ensure chat");
    return chat;
  },

  async getChat(ctx: BaseCtx, input: GetChatInput) {
    const chat = await repo.getChatForUser(ctx.db, input.chatId, ctx.userId);
    if (!chat)
      return {
        chat: null,
        messages: [] as Awaited<ReturnType<typeof repo.listMessagesByChat>>,
      };
    const messages = await repo.listMessagesByChat(ctx.db, chat.id);
    return { chat, messages };
  },

  async list(ctx: BaseCtx, input: ListChatsInput) {
    return repo.listRecentChatsForUser(ctx.db, ctx.userId, input.limit);
  },

  async deleteChat(ctx: BaseCtx, input: DeleteChatInput) {
    const ok = await repo.deleteChatForUser(ctx.db, input.chatId, ctx.userId);
    if (!ok) throw appError(ErrCode.NotFound, "Chat not found");
    return { id: input.chatId };
  },

  async appendUserMessage(ctx: BaseCtx, input: AppendUserMessageInput) {
    const chat = await repo.getChatForUser(ctx.db, input.chatId, ctx.userId);
    if (!chat) throw appError(ErrCode.NotFound, "Chat not found");

    const userMessage = await repo.insertMessage(ctx.db, {
      chatId: chat.id,
      role: "user",
      contentBlocks: input.blocks as ContentBlock[],
    });
    if (!userMessage)
      throw appError(ErrCode.Internal, "Failed to persist user message");

    const assistantMessage = await repo.insertMessage(ctx.db, {
      chatId: chat.id,
      role: "assistant",
      contentBlocks: echoReply(input.blocks),
      model: chat.model,
    });
    if (!assistantMessage)
      throw appError(ErrCode.Internal, "Failed to persist assistant message");

    await repo.bumpLastMessageAt(ctx.db, chat.id, new Date());

    return { userMessage, assistantMessage };
  },

  async checkAdmission(
    ctx: BaseCtx,
    input: CheckAdmissionInput,
  ): Promise<ChatLimitBreach | null> {
    try {
      const [messageCount, totalCostCents] = await Promise.all([
        repo.countMessagesByChat(ctx.db, input.chatId),
        getChatTotalCostCents(ctx.db, input.chatId),
      ]);
      return checkChatLimits({ messageCount, totalCostCents }, input.limits);
    } catch (err) {
      console.warn(
        `[chats.checkAdmission] fail-open: unable to read chat stats for chatId=${input.chatId}:`,
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  },

  async getPendingInterrupt(ctx: BaseCtx, chatId: string) {
    const chat = await repo.getChatForUser(ctx.db, chatId, ctx.userId);
    if (!chat) return null;
    const event = await repo.getLatestInterruptForChat(ctx.db, chatId);
    if (!event) return null;
    const payload = event.payload as { kind?: string; interrupt?: unknown };
    if (payload.kind !== "interrupt") return null;
    return (payload.interrupt ?? null) as Record<string, unknown> | null;
  },

  async editUserMessage(ctx: BaseCtx, input: EditUserMessageInput) {
    const target = await repo.findOwnedUserMessage(
      ctx.db,
      input.messageId,
      ctx.userId,
    );
    if (!target) throw appError(ErrCode.NotFound, "Message not found");
    if (target.role !== "user") {
      throw appError(ErrCode.BadInput, "Only user messages can be edited");
    }

    const updatedUser = await repo.updateMessageBlocks(
      ctx.db,
      target.id,
      input.blocks as ContentBlock[],
    );
    if (!updatedUser)
      throw appError(ErrCode.Internal, "Failed to update user message");

    const nextAssistant = await repo.findNextAssistantMessage(
      ctx.db,
      target.chatId,
      target.createdAt,
    );
    let updatedAssistant = nextAssistant;
    if (nextAssistant) {
      updatedAssistant = await repo.updateMessageBlocks(
        ctx.db,
        nextAssistant.id,
        echoReply(input.blocks),
      );
    }

    await repo.bumpLastMessageAt(ctx.db, target.chatId, new Date());

    return { userMessage: updatedUser, assistantMessage: updatedAssistant };
  },
};
