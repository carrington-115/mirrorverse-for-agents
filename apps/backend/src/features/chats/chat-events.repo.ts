import { sql, schema, type Database } from "@mirrorverse/db";
import type { ChatEventKind, ChatEventPayload } from "@mirrorverse/types";

const { chatEvents } = schema;

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
