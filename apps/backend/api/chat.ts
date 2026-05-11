import { runMirropilot } from "@mirrorverse/agent";
import type { UIMessage } from "ai";

import { env } from "@mirrorverse/env/backend";
import { verifyToken } from "@mirrorverse/db";
import type { ContentBlock, UserId } from "@mirrorverse/types";

import { BEARER } from "../src/config";
import { getDb } from "@mirrorverse/db";
import { ensureUserWorkspace } from "../src/features/tenancy/repo";
import {
  bumpLastMessageAt,
  ensureChat,
  insertMessage,
  setChatTitleIfEmpty,
} from "../src/features/chats/repo";

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

function uiMessageToBlocks(msg: UIMessage): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  for (const part of msg.parts) {
    if (
      part.type === "text" &&
      typeof (part as { text?: unknown }).text === "string"
    ) {
      blocks.push({
        type: "text",
        text: (part as { text: string }).text,
      } as ContentBlock);
    }
  }
  return blocks;
}

export async function POST(req: Request): Promise<Response> {
  const session = await authenticate(req);
  if (!session) return jsonError(401, "Authentication required");

  const body = (await req.json().catch(() => null)) as {
    id?: string;
    chatId?: string;
    messages?: UIMessage[];
  } | null;
  if (!body || !Array.isArray(body.messages)) {
    return jsonError(400, "Invalid request body");
  }

  const chatId = body.chatId ?? body.id;
  if (!chatId || chatId.startsWith("__LOCALID_")) {
    return jsonError(400, "Missing or invalid chatId");
  }

  const db = getDb();
  const workspaceId = await ensureUserWorkspace(db, session.userId);
  const chat = await ensureChat(db, {
    chatId,
    workspaceId,
    userId: session.userId,
  });
  if (!chat) return jsonError(500, "Failed to ensure chat");

  const lastUser = body.messages[body.messages.length - 1];
  if (!lastUser || lastUser.role !== "user") {
    return jsonError(400, "Expected last message to be from user");
  }
  const userBlocks = uiMessageToBlocks(lastUser);
  if (userBlocks.length === 0) return jsonError(400, "Empty user message");

  await insertMessage(db, {
    chatId: chat.id,
    role: "user",
    contentBlocks: userBlocks,
  });

  if (!chat.title) {
    const firstText = userBlocks
      .map((b) =>
        typeof (b as { text?: string }).text === "string"
          ? (b as { text: string }).text
          : "",
      )
      .join(" ")
      .trim();
    if (firstText.length > 0) {
      const title =
        firstText.length > 60 ? `${firstText.slice(0, 57)}…` : firstText;
      await setChatTitleIfEmpty(db, chat.id, title);
    }
  }

  return runMirropilot({
    db,
    userId: session.userId,
    workspaceId,
    chatId: chat.id,
    messages: body.messages,
    onFinish: async ({ responseMessage }) => {
      try {
        const assistantBlocks = uiMessageToBlocks(responseMessage);
        if (assistantBlocks.length > 0) {
          await insertMessage(db, {
            chatId: chat.id,
            role: "assistant",
            contentBlocks: assistantBlocks,
            model: chat.model,
          });
        }
        await bumpLastMessageAt(db, chat.id, new Date());
      } catch (err) {
        if (env.NODE_ENV === "development") {
          console.error("[chat] failed to persist assistant message:", err);
        }
      }
    },
  });
}
