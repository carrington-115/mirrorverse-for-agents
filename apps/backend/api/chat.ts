import { createAssistantStreamResponse } from "assistant-stream";

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
} from "../src/features/chats/repo";

interface UIMessagePart {
  type: string;
  text?: string;
}

interface UIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: UIMessagePart[];
}

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "user") continue;
    return msg.parts
      .filter(
        (p): p is UIMessagePart & { text: string } =>
          p.type === "text" && typeof p.text === "string",
      )
      .map((p) => p.text)
      .join("\n\n")
      .trim();
  }
  return "";
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

export async function POST(req: Request): Promise<Response> {
  const session = await authenticate(req);
  if (!session) return jsonError(401, "Authentication required");

  const body = (await req.json().catch(() => null)) as {
    id?: string;
    messages?: UIMessage[];
  } | null;
  if (!body || !body.id || !Array.isArray(body.messages)) {
    return jsonError(400, "Invalid request body");
  }

  const db = getDb();
  const workspaceId = await ensureUserWorkspace(db, session.userId);
  const chat = await ensureChat(db, {
    chatId: body.id,
    workspaceId,
    userId: session.userId,
  });
  if (!chat) return jsonError(500, "Failed to ensure chat");

  const lastUser = body.messages[body.messages.length - 1];
  if (!lastUser || lastUser.role !== "user") {
    return jsonError(400, "Expected last message to be from user");
  }

  const userBlocks: ContentBlock[] = lastUser.parts
    .filter(
      (p): p is UIMessagePart & { text: string } =>
        p.type === "text" && typeof p.text === "string",
    )
    .map((p) => ({ type: "text", text: p.text }) as ContentBlock);

  if (userBlocks.length === 0) return jsonError(400, "Empty user message");

  await insertMessage(db, {
    chatId: chat.id,
    role: "user",
    contentBlocks: userBlocks,
  });

  const replyText = `Echo: ${lastUserText(body.messages)}\n\n(The orchestrator agent isn't wired up yet — replies are placeholder.)`;

  return createAssistantStreamResponse(async (stream) => {
    const words = replyText.split(/(\s+)/);
    for (const word of words) {
      if (!word) continue;
      stream.appendText(word);
      await new Promise((r) => setTimeout(r, 12));
    }
    stream.close();

    void insertMessage(db, {
      chatId: chat.id,
      role: "assistant",
      contentBlocks: [{ type: "text", text: replyText } as ContentBlock],
      model: chat.model,
    })
      .then(() => bumpLastMessageAt(db, chat.id, new Date()))
      .catch((err) => {
        if (env.NODE_ENV === "development") {
          console.error("[chat] failed to persist assistant message:", err);
        }
      });
  });
}
