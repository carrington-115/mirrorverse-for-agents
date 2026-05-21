import {
  DEFAULT_CHAT_LIMITS,
  describeChatLimitBreach,
  generateChatTitle,
  isSupportedModel,
  runMirropilot,
} from "@mirrorverse/agent";
import { randomUUID } from "node:crypto";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  tool,
  type Tool,
} from "ai";

import { env } from "@mirrorverse/env/backend";
import { getDb } from "@mirrorverse/db";
import type {
  ChatId,
  McpServerId,
  ConnectionRequestId,
} from "@mirrorverse/types";
import type { UIMessage } from "ai";

import { authenticateRequest } from "../src/lib/auth";
import { buildPhoneTools } from "../src/features/voice/chat-tools";
import { ensureUserWorkspace } from "../src/features/tenancy/repo";
import { listWorkspaceWebhooks } from "../src/features/webhooks/repo";
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
import {
  isComposioConfigured,
  listComposioTools,
  getComposioAuthRedirectUrl,
  lookupComposioMcpServerId,
} from "../src/mcp/composio/client";
import {
  NeedsAuthError,
  invokeComposioTool,
} from "../src/mcp/composio/dispatcher";
import { createConnectionRequest } from "../src/mcp/composio/auth";
import { runPreflightCheck } from "../src/mcp/composio/preflight";
import type { Database } from "@mirrorverse/db";

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

function isConnectedAccountNotFound(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.constructor.name === "ComposioConnectedAccountNotFoundError" ||
    err.message.toLowerCase().includes("connected account") ||
    err.message.toLowerCase().includes("not found")
  );
}

async function buildComposioTools(
  db: Database,
  workspaceId: string,
  chatId: string,
): Promise<Record<string, Tool>> {
  if (!isComposioConfigured()) return {};

  const [schemaTools, composioMcpServerId] = await Promise.all([
    listComposioTools(workspaceId),
    lookupComposioMcpServerId(db),
  ]);

  if (!composioMcpServerId) return {};

  const result: Record<string, Tool> = {};

  for (const [slug, baseTool] of Object.entries(schemaTools)) {
    const appSlug = slug.split("_")[0]?.toLowerCase() ?? slug;
    result[slug] = tool({
      description: (baseTool as { description?: string }).description ?? slug,
      inputSchema: (
        baseTool as { inputSchema: Parameters<typeof tool>[0]["inputSchema"] }
      ).inputSchema,
      execute: async (args: Record<string, unknown>) => {
        try {
          const res = await invokeComposioTool(slug, args, workspaceId);
          return JSON.stringify(res);
        } catch (err) {
          if (
            err instanceof NeedsAuthError ||
            isConnectedAccountNotFound(err)
          ) {
            const resolvedSlug =
              err instanceof NeedsAuthError ? err.appSlug : appSlug;
            let redirectUrl =
              err instanceof NeedsAuthError ? err.redirectUrl : null;

            const connectionRequestId = randomUUID();

            if (!redirectUrl) {
              const callbackBase =
                env.COMPOSIO_OAUTH_CALLBACK_URL ??
                `http://localhost:${env.PORT}/api/connections/callback`;
              const callbackUrl = `${callbackBase}?requestId=${connectionRequestId}`;
              redirectUrl = await getComposioAuthRedirectUrl(
                workspaceId,
                resolvedSlug,
                callbackUrl,
              ).catch(() => null);
            }

            if (!redirectUrl) {
              console.warn(
                `[chat] composio: no redirectUrl for appSlug=${resolvedSlug}, interrupt skipped`,
              );
            }

            if (redirectUrl) {
              const connectionReq = await createConnectionRequest(db, {
                id: connectionRequestId,
                workspaceId,
                chatId,
                mcpServerId: composioMcpServerId,
                appSlug: resolvedSlug,
                redirectUrl,
              });

              await safeAppendChatEvent({
                db,
                chatId,
                kind: "interrupt",
                payload: {
                  kind: "interrupt",
                  interrupt: {
                    id: connectionReq.id,
                    kind: "needs_credential",
                    chatId: chatId as ChatId,
                    mcpServerId: composioMcpServerId as McpServerId,
                    appSlug: resolvedSlug,
                    redirectUrl,
                    connectionRequestId:
                      connectionReq.id as ConnectionRequestId,
                    resumeEventName: connectionReq.resumeEventName,
                    expiresAt: connectionReq.expiresAt,
                  },
                },
              });
            }

            return `Authentication required: please connect your ${resolvedSlug} account using the popup that appeared.`;
          }
          throw err;
        }
      },
    });
  }

  return result;
}

interface ChatRequestBody {
  readonly id?: string;
  readonly chatId?: string;
  readonly messages?: UIMessage[];
  readonly model?: string;
  readonly builderModel?: string;
  readonly skipUserInsert?: boolean;
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
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
  const user = await authenticateRequest(req);
  if (!user) {
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
    `[chat] POST userId=${user.id} chatId=${chatId} ` +
      `messages=${body.messages.length} model=${requestedModel ?? "<default>"}`,
  );

  const db = getDb();
  const workspaceId = await ensureUserWorkspace(db, user.id);
  const chat = await ensureChat(db, { chatId, workspaceId, userId: user.id });
  if (!chat) return jsonError(500, "Failed to ensure chat");

  const breach = await chatsService.checkAdmission(
    { db, userId: user.id },
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

  if (!body.skipUserInsert) {
    await insertMessage(db, {
      chatId: chat.id,
      role: "user",
      contentBlocks: userBlocks,
    });
  }

  const startingText = firstUserText(userBlocks);
  const needsTitle = !chat.title && startingText.length > 0;

  // Generate the title before streaming starts so the DB has it by the time
  // the client's onFinish invalidates the sidebar query. Haiku is fast (~500ms)
  // so the added latency before the first chunk is negligible.
  if (needsTitle) {
    const title = await generateChatTitle(startingText).catch((err) => {
      console.error("[chat] title generation failed:", err);
      return null;
    });
    if (title) await setChatTitleIfEmpty(db, chat.id, title);
  }

  const runId = randomUUID();
  const modelForRun = requestedModel ?? chat.model;
  const requestedBuilderModel =
    typeof body.builderModel === "string" && isSupportedModel(body.builderModel)
      ? body.builderModel
      : undefined;
  // Default the builder to whatever model the user picked for the chat, so
  // their pick actually controls cost. We previously fell back to a hardcoded
  // Anthropic Sonnet, which billed users on a different provider than they
  // selected.
  const builderModel = requestedBuilderModel ?? modelForRun;
  let stepIndex = 0;

  const [composioTools, workspaceWebhooks] = await Promise.all([
    buildComposioTools(db, workspaceId, chat.id).catch((err) => {
      if (env.NODE_ENV === "development") {
        console.error("[chat] failed to build composio tools:", err);
      }
      return {} as Record<string, Tool>;
    }),
    listWorkspaceWebhooks(db, workspaceId).catch(() => []),
  ]);

  const phoneTools = buildPhoneTools({ db, workspaceId, userId: user.id });

  const additionalTools = { ...composioTools, ...phoneTools };

  const webhookContextLines = workspaceWebhooks.map((w) => {
    let line = `- ${w.name}: ${w.url}`;
    if (w.description) line += ` — ${w.description}`;
    return line;
  });
  const systemPromptSuffix =
    webhookContextLines.length > 0
      ? `Workspace webhooks:\n${webhookContextLines.join("\n")}\nWhen the user asks to call back to their system, trigger an event, or send data to an external endpoint, reference these webhook URLs.`
      : undefined;

  // Pre-flight: detect external app slugs in the user message and check
  // whether they're connected. If a connection is missing, emit an interrupt
  // event and return an empty stream so the frontend polls pendingInterrupt.
  const preflight = await runPreflightCheck(
    db,
    workspaceId,
    chat.id,
    startingText,
  );
  if (preflight.interrupted) {
    console.log(
      `[chat] preflight interrupted chatId=${chat.id} missingSlug=${preflight.missingSlug}`,
    );
    // Return an empty stream so useChat's onFinish fires, streamFinished becomes
    // true, and the pendingInterrupt poll picks up the connectionRequest row.
    const stream = createUIMessageStream<UIMessage>({
      originalMessages: body.messages,
      execute: async () => {
        /* intentionally empty */
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  return runMirropilot({
    additionalTools,
    db,
    userId: user.id,
    workspaceId,
    chatId: chat.id,
    messages: body.messages,
    model: modelForRun,
    builderModel,
    systemPromptSuffix,
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
      } catch (err) {
        if (env.NODE_ENV === "development") {
          console.error("[chat] failed to persist assistant message:", err);
        }
      }
    },
  });
}
