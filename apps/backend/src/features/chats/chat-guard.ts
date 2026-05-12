import {
  checkChatLimits,
  type ChatLimitBreach,
  type ChatLimits,
} from "@mirrorverse/agent";
import type { Database } from "@mirrorverse/db";

import { getChatTotalCostCents } from "../billing/repo";
import { countMessagesByChat } from "./repo";

export interface CheckChatAdmissionInput {
  readonly db: Database;
  readonly chatId: string;
  readonly limits: ChatLimits;
}

export async function checkChatAdmission(
  input: CheckChatAdmissionInput,
): Promise<ChatLimitBreach | null> {
  try {
    const [messageCount, totalCostCents] = await Promise.all([
      countMessagesByChat(input.db, input.chatId),
      getChatTotalCostCents(input.db, input.chatId),
    ]);
    return checkChatLimits({ messageCount, totalCostCents }, input.limits);
  } catch (err) {
    console.warn(
      `[chat-guard] fail-open: unable to read chat stats for chatId=${input.chatId}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
