import {
  and,
  asc,
  desc,
  eq,
  gt,
  schema,
  sql,
  type Database,
} from "@mirrorverse/db";
import type {
  ChatEventKind,
  ChatEventPayload,
  ContentBlock,
  CostBreakdown,
  MessageRole,
} from "@mirrorverse/types";

const { chats, chatEvents, messages } = schema;

const ZERO_COST: CostBreakdown = {
  tokensIn: 0,
  tokensInCached: 0,
  tokensOut: 0,
  costCents: 0,
};

export interface EnsureChatArgs {
  readonly chatId: string;
  readonly workspaceId: string;
  readonly userId: string;
  readonly title?: string;
}

export async function ensureChat(db: Database, args: EnsureChatArgs) {
  const [row] = await db
    .insert(chats)
    .values({
      id: args.chatId,
      workspaceId: args.workspaceId,
      userId: args.userId,
      purpose: "generate_workflow",
      status: "active",
      title: args.title ?? null,
      model: "claude-opus-4-7",
      cost: ZERO_COST,
    })
    .onConflictDoNothing()
    .returning();

  if (row) return row;
  const [existing] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, args.chatId))
    .limit(1);
  return existing ?? null;
}

export async function getChatForUser(
  db: Database,
  chatId: string,
  userId: string,
) {
  const [row] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function listMessagesByChat(db: Database, chatId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);
}

export async function listRecentChatsForUser(
  db: Database,
  userId: string,
  limit: number,
) {
  return db
    .select({
      id: chats.id,
      title: chats.title,
      status: chats.status,
      lastMessageAt: chats.lastMessageAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.lastMessageAt), desc(chats.updatedAt))
    .limit(limit);
}

export interface InsertMessageArgs {
  readonly chatId: string;
  readonly role: MessageRole;
  readonly contentBlocks: readonly ContentBlock[];
  readonly model?: string;
}

export async function insertMessage(db: Database, args: InsertMessageArgs) {
  const [row] = await db
    .insert(messages)
    .values({
      chatId: args.chatId,
      role: args.role,
      contentBlocks: args.contentBlocks as ContentBlock[],
      cost: ZERO_COST,
      model: args.model ?? null,
    })
    .returning();
  return row;
}

export async function bumpLastMessageAt(
  db: Database,
  chatId: string,
  when: Date,
) {
  await db
    .update(chats)
    .set({ lastMessageAt: when })
    .where(eq(chats.id, chatId));
}

export async function setChatTitleIfEmpty(
  db: Database,
  chatId: string,
  title: string,
) {
  await db
    .update(chats)
    .set({ title })
    .where(and(eq(chats.id, chatId), sql`${chats.title} is null`));
}

export async function findOwnedUserMessage(
  db: Database,
  messageId: string,
  userId: string,
) {
  const [row] = await db
    .select({
      id: messages.id,
      chatId: messages.chatId,
      role: messages.role,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(chats, eq(chats.id, messages.chatId))
    .where(and(eq(messages.id, messageId), eq(chats.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function findNextAssistantMessage(
  db: Database,
  chatId: string,
  afterCreatedAt: Date,
) {
  const [row] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.chatId, chatId),
        eq(messages.role, "assistant"),
        gt(messages.createdAt, afterCreatedAt),
      ),
    )
    .orderBy(asc(messages.createdAt))
    .limit(1);
  return row ?? null;
}

export async function deleteChatForUser(
  db: Database,
  chatId: string,
  userId: string,
) {
  const result = await db
    .delete(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .returning({ id: chats.id });
  return result.length > 0;
}

export async function updateMessageBlocks(
  db: Database,
  messageId: string,
  blocks: readonly ContentBlock[],
) {
  const [row] = await db
    .update(messages)
    .set({ contentBlocks: blocks as ContentBlock[] })
    .where(eq(messages.id, messageId))
    .returning();
  return row ?? null;
}

export async function countMessagesByChat(
  db: Database,
  chatId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(eq(messages.chatId, chatId));
  return row?.count ?? 0;
}

export async function markChatFailed(
  db: Database,
  chatId: string,
  endedAt: Date = new Date(),
) {
  await db
    .update(chats)
    .set({ status: "failed", endedAt })
    .where(eq(chats.id, chatId));
}

export interface AppendChatEventInput {
  readonly db: Database;
  readonly chatId: string;
  readonly kind: ChatEventKind;
  readonly payload: ChatEventPayload;
}

export async function appendChatEvent(
  input: AppendChatEventInput,
): Promise<void> {
  await input.db.insert(chatEvents).values({
    chatId: input.chatId,
    kind: input.kind,
    payload: input.payload,
    sequence: sql`coalesce((select max(sequence) from chat_events where chat_id = ${input.chatId}), -1) + 1`,
  });
}
