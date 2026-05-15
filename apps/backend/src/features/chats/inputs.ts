import { z } from "zod";

const textBlock = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(20_000),
});

export const userContentBlock = textBlock;
export type UserContentBlock = z.infer<typeof userContentBlock>;

export const ensureChatInput = z.object({
  chatId: z.string().min(1).max(128),
  title: z.string().min(1).max(200).optional(),
});

export const getChatInput = z.object({
  chatId: z.string().min(1).max(128),
});

export const getPendingInterruptInput = z.object({
  chatId: z.string().min(1).max(128),
});

export type GetPendingInterruptInput = z.infer<typeof getPendingInterruptInput>;

export const deleteChatInput = z.object({
  chatId: z.string().min(1).max(128),
});

export const listChatsInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
  })
  .default({ limit: 50 });

export const appendUserMessageInput = z.object({
  chatId: z.string().min(1).max(128),
  blocks: z.array(userContentBlock).min(1).max(20),
});

export const editUserMessageInput = z.object({
  messageId: z.string().min(1).max(128),
  blocks: z.array(userContentBlock).min(1).max(20),
});

export type EnsureChatInput = z.infer<typeof ensureChatInput>;
export type GetChatInput = z.infer<typeof getChatInput>;
export type DeleteChatInput = z.infer<typeof deleteChatInput>;
export type ListChatsInput = z.infer<typeof listChatsInput>;
export type AppendUserMessageInput = z.infer<typeof appendUserMessageInput>;
export type EditUserMessageInput = z.infer<typeof editUserMessageInput>;
