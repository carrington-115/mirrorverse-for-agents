import {
  DEFAULT_CHAT_LIMITS,
  describeChatLimitBreach,
  generateChatTitle,
  isSupportedModel,
  runMirropilot,
} from "@mirrorverse/agent";
import { randomUUID } from "node:crypto";
import type { UIMessage } from "ai";

import { env } from "@mirrorverse/env/backend";
import { verifyToken } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { BEARER } from "../src/config";
import { getDb } from "@mirrorverse/db";
import { ensureUserWorkspace } from "../src/features/tenancy/repo";
import { recordChatUsage } from "../src/features/billing/repo";
import {
  firstUserText,
  lifecycleToChatEventPayload,
  uiMessageToContentBlocks,
} from "../src/features/chats/mappers";
import {
  appendChatEvent,
  bumpLastMessageAt,
  ensureChat,
  insertMessage,
  markChatFailed,
  setChatTitleIfEmpty,
} from "../src/features/chats/repo";
import { chatsService } from "../src/features/chats/service";

async function safeAppendChatEvent(
  ...args: Parameters<typeof appendChatEvent>
): Promise<void> {
  try {
    await appendChatEvent(...args);
  } catch (err) {
    if (env.NODE_ENV === "development") {
      console.error("[chat] failed to append chat_event:", err);
    }
  }
}

interface ChatRequestBody {
  readonly id?: string;
  readonly chatId?: string;
  readonly messages?: UIMessage[];
  readonly model?: string;
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function authenticate(
  req: Request,
): Promise<{ userId: UserId; email: string } | null> {
  const auth = req.headers.get("authorization");
  const match = auth?.match(BEARER);
  const token = match?.[1];
  if (!token) return null;
  const verified = await verifyToken(token);
  if (!verified) return null;
  return { userId: verified.sub as UserId, email: verified.email };
}

function resolveChatId(body: ChatRequestBody): string | null {
  const chatId = body.chatId ?? body.id;
  if (!chatId || chatId.startsWith("__LOCALID_")) return null;
  return chatId;
}

function resolveModel(body: ChatRequestBody): string | null | undefined {
  if (body.model == null) return undefined;
  if (typeof body.model !== "string") return null;
  if (!isSupportedModel(body.model)) return null;
  return body.model;
}

export async function POST(req: Request): Promise<Response> {
  const session = await authenticate(req);
  if (!session) {
    console.warn("[chat] 401 missing/invalid bearer");
    return jsonError(401, "Authentication required");
  }

  const body = (await req.json().catch(() => null)) as ChatRequestBody | null;
  if (!body || !Array.isArray(body.messages)) {
    console.warn("[chat] 400 invalid body shape");
    return jsonError(400, "Invalid request body");
  }

  const chatId = resolveChatId(body);
  if (!chatId) {
    console.warn(`[chat] 400 invalid chatId=${body.chatId ?? body.id}`);
    return jsonError(400, "Missing or invalid chatId");
  }

  const requestedModel = resolveModel(body);
  if (requestedModel === null) {
    return jsonError(400, `Unsupported model: ${body.model}`);
  }

  console.log(
    `[chat] POST userId=${session.userId} chatId=${chatId} ` +
      `messages=${body.messages.length} model=${requestedModel ?? "<default>"}`,
  );

  const db = getDb();
  const workspaceId = await ensureUserWorkspace(db, session.userId);
  const chat = await ensureChat(db, {
    chatId,
    workspaceId,
    userId: session.userId,
  });
  if (!chat) return jsonError(500, "Failed to ensure chat");

  const breach = await chatsService.checkAdmission(
    { db, userId: session.userId },
    { chatId: chat.id, limits: DEFAULT_CHAT_LIMITS },
  );
  if (breach) {
    const reason = describeChatLimitBreach(breach);
    try {
      await markChatFailed(db, chat.id);
    } catch (err) {
      if (env.NODE_ENV === "development") {
        console.error("[chat] failed to mark chat failed:", err);
      }
    }
    await safeAppendChatEvent({
      db,
      chatId: chat.id,
      kind: "chat_failed",
      payload: { kind: "chat_failed", reason },
    });
    console.warn(`[chat] 429 cap breach chatId=${chat.id} kind=${breach.kind}`);
    return jsonError(429, reason);
  }

  const lastUser = body.messages[body.messages.length - 1];
  if (!lastUser || lastUser.role !== "user") {
    return jsonError(400, "Expected last message to be from user");
  }
  const userBlocks = uiMessageToContentBlocks(lastUser);
  if (userBlocks.length === 0) return jsonError(400, "Empty user message");

  await insertMessage(db, {
    chatId: chat.id,
    role: "user",
    contentBlocks: userBlocks,
  });

  const startingText = firstUserText(userBlocks);
  const needsTitle = !chat.title && startingText.length > 0;

  const runId = randomUUID();
  const modelForRun = requestedModel ?? chat.model;
  const builderModel =
    env.NODE_ENV === "production" ? "claude-sonnet-4-5" : "claude-haiku-4-5";
  let stepIndex = 0;

  return runMirropilot({
    db,
    userId: session.userId,
    workspaceId,
    chatId: chat.id,
    messages: body.messages,
    model: modelForRun,
    builderModel,
    onLifecycleEvent: async (event) => {
      await safeAppendChatEvent({
        db,
        chatId: chat.id,
        kind: event.kind,
        payload: lifecycleToChatEventPayload(event),
      });
    },
    onUsage: async ({ model, breakdown }) => {
      const index = stepIndex++;
      try {
        await recordChatUsage({
          db,
          workspaceId,
          chatId: chat.id,
          idempotencyKey: `chat:${chat.id}:${runId}:${index}`,
          model,
          breakdown,
        });
      } catch (err) {
        if (env.NODE_ENV === "development") {
          const message = err instanceof Error ? err.message : String(err);
          console.warn(
            `[chat] usage write skipped (${message.split("\n")[0]})`,
          );
        }
      }
    },
    onFinish: async ({ responseMessage }) => {
      try {
        const assistantBlocks = uiMessageToContentBlocks(responseMessage);
        if (assistantBlocks.length > 0) {
          await insertMessage(db, {
            chatId: chat.id,
            role: "assistant",
            contentBlocks: assistantBlocks,
            model: modelForRun,
          });
        }
        await bumpLastMessageAt(db, chat.id, new Date());
        if (needsTitle) {
          const title = await generateChatTitle(startingText);
          if (title) {
            await setChatTitleIfEmpty(db, chat.id, title);
          }
        }
      } catch (err) {
        if (env.NODE_ENV === "development") {
          console.error("[chat] failed to persist assistant message:", err);
        }
      }
    },
  });
}
