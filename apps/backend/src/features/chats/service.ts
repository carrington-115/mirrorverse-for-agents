import {
  checkChatLimits,
  type ChatLimitBreach,
  type ChatLimits,
} from "@mirrorverse/agent";
import type { Database } from "@mirrorverse/db";
import type { ContentBlock, UserId } from "@mirrorverse/types";

import { appError, ErrCode } from "../../lib/errors";
import { getChatTotalCostCents } from "../billing/repo";

import * as repo from "./repo";
import * as workflowsRepo from "../workflows/repo";
import type {
  AppendUserMessageInput,
  DeleteChatInput,
  DeleteLastAssistantInput,
  EditAndTruncateInput,
  EditUserMessageInput,
  EnsureChatInput,
  GetChatInput,
  ListChatsInput,
  PinChatInput,
} from "./inputs";

interface BaseCtx {
  readonly db: Database;
  readonly userId: UserId;
}

interface WorkspaceCtx extends BaseCtx {
  readonly workspaceId: string;
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
  async ensureChat(ctx: WorkspaceCtx, input: EnsureChatInput) {
    const chat = await repo.ensureChat(ctx.db, {
      chatId: input.chatId,
      workspaceId: ctx.workspaceId,
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
    const chat = await repo.getChatForUser(ctx.db, input.chatId, ctx.userId);
    if (!chat) throw appError(ErrCode.NotFound, "Chat not found");

    if (chat.workflowId) {
      await workflowsRepo.deleteWorkflowForWorkspace(
        ctx.db,
        chat.workflowId,
        chat.workspaceId,
      );
    }

    const ok = await repo.deleteChatForUser(ctx.db, input.chatId, ctx.userId);
    if (!ok) throw appError(ErrCode.NotFound, "Chat not found");
    return { id: input.chatId };
  },

  async pinChat(ctx: BaseCtx, input: PinChatInput) {
    const ok = await repo.setChatPinned(
      ctx.db,
      input.chatId,
      ctx.userId,
      input.isPinned,
    );
    if (!ok) throw appError(ErrCode.NotFound, "Chat not found");
    return { id: input.chatId, isPinned: input.isPinned };
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
    const interrupt = (payload.interrupt ?? null) as Record<
      string,
      unknown
    > | null;
    if (!interrupt) return null;

    // For the plural preflight interrupt, filter out slugs that are now connected.
    // Returns null when all apps are connected so the frontend panel auto-dismisses.
    if (interrupt.kind === "needs_credentials") {
      const stillMissing = await repo.filterUnconnectedSlugs(
        ctx.db,
        chat.workspaceId,
        interrupt.appSlugs as string[],
      );
      if (stillMissing.length === 0) return null;
      return { ...interrupt, appSlugs: stillMissing };
    }

    return interrupt;
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

  async editAndTruncate(ctx: BaseCtx, input: EditAndTruncateInput) {
    const target = await repo.findOwnedUserMessage(
      ctx.db,
      input.messageId,
      ctx.userId,
    );
    if (!target) throw appError(ErrCode.NotFound, "Message not found");
    if (target.role !== "user") {
      throw appError(ErrCode.BadInput, "Only user messages can be edited");
    }
    const updated = await repo.updateMessageBlocks(
      ctx.db,
      target.id,
      input.blocks as ContentBlock[],
    );
    if (!updated)
      throw appError(ErrCode.Internal, "Failed to update user message");
    const deleted = await repo.deleteMessagesAfter(
      ctx.db,
      target.chatId,
      target.createdAt,
    );
    await repo.bumpLastMessageAt(ctx.db, target.chatId, new Date());
    return { userMessage: updated, deletedCount: deleted };
  },

  async deleteLastAssistant(ctx: BaseCtx, input: DeleteLastAssistantInput) {
    const chat = await repo.getChatForUser(ctx.db, input.chatId, ctx.userId);
    if (!chat) throw appError(ErrCode.NotFound, "Chat not found");
    const result = await repo.deleteLastAssistantMessage(ctx.db, chat.id);
    return { deletedId: result?.id ?? null };
  },
};
