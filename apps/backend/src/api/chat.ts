import "../lib/tracing"; // must be first — registers OTel before any spans
import {
  DEFAULT_CHAT_LIMITS,
  describeChatLimitBreach,
  generateChatTitle,
  isSupportedModel,
  runMirrorpilot,
  type ChatLimits,
} from "@mirrorverse/agent";
import { APP_EVENT_CATALOG } from "@mirrorverse/agent/schemas";
import { randomUUID } from "node:crypto";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  tool,
  type Tool,
} from "ai";
import { z } from "zod";

import { env } from "@mirrorverse/env/backend";
import { getDb } from "@mirrorverse/db";
import type {
  ChatId,
  McpServerId,
  ConnectionRequestId,
} from "@mirrorverse/types";
import type { UIMessage } from "ai";

import { authenticateRequest } from "../lib/auth";
import { ErrCode } from "../lib/errors";
import { buildPhoneTools } from "../features/voice/chat-tools";
import { buildKnowledgeTools } from "../features/knowledge/chat-tools";
import {
  resolveSelectedDocumentKbs,
  type ResolvedSelectedDocument,
} from "../features/knowledge/repo";
import { ensureUserWorkspace } from "../features/tenancy/repo";
import { listWorkspaceWebhooks } from "../features/webhooks/repo";
import {
  countGenerationsThisPeriod,
  getActiveSubscription,
  recordChatUsage,
} from "../features/billing/repo";
import {
  checkCreditQuota,
  QuotaExceededError,
} from "../features/billing/enforcement";
import {
  firstUserText,
  lifecycleToChatEventPayload,
  uiMessageToContentBlocks,
} from "../features/chats/mappers";
import {
  appendChatEvent,
  bumpLastMessageAt,
  ensureChat,
  insertMessage,
  markChatFailed,
  setChatTitleIfEmpty,
} from "../features/chats/repo";
import { chatsService } from "../features/chats/service";
import {
  isComposioConfigured,
  listComposioTools,
  listComposioToolsForApp,
  listConnectedApps,
  getComposioAuthRedirectUrl,
  lookupComposioMcpServerId,
} from "../mcp/composio/client";
import { listWorkspaceMcpServers } from "../features/tools/repo";
import { NeedsAuthError, invokeComposioTool } from "../mcp/composio/dispatcher";
import { createConnectionRequest } from "../mcp/composio/auth";
import { runPreflightCheck } from "../mcp/composio/preflight";
import { makeFirstPartyAiTools } from "../mcp/agent-tools";
import { flushTracing } from "../lib/tracing";
import { checkRateLimit, rateLimitedResponse } from "../lib/rate-limit";
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

async function buildIntrospectionTools(
  db: Database,
  workspaceId: string,
): Promise<Record<string, Tool>> {
  return {
    list_connected_apps: tool({
      description:
        "List the external apps and services the user has connected to their workspace (e.g. Gmail, Slack, GitHub). Call this when the user asks what apps they have connected, or when you need to verify a connection before building a workflow.",
      inputSchema: z.object({}),
      execute: async () => {
        const apps = await listConnectedApps(workspaceId).catch(() => []);
        return { apps };
      },
    }),
    list_mcp_servers: tool({
      description:
        "List the custom MCP servers configured in the user's workspace. Call this when the user references a custom MCP tool and you need the real server ID to include in the workflow intent.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await listWorkspaceMcpServers(db, workspaceId).catch(
          () => [],
        );
        const servers = rows.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          url: r.url ?? null,
        }));
        return { servers };
      },
    }),
    list_app_event_catalog: tool({
      description:
        "List the supported app-event trigger apps and their available event slugs. Call this when building a trigger.app_event node and you need the exact eventSlug for an app.",
      inputSchema: z.object({
        appSlug: z
          .string()
          .optional()
          .describe(
            "Filter to a single app, e.g. 'github'. Omit to get the full catalog.",
          ),
      }),
      execute: async ({ appSlug }) => {
        const catalog = appSlug
          ? { [appSlug]: APP_EVENT_CATALOG[appSlug] ?? null }
          : APP_EVENT_CATALOG;
        return { catalog };
      },
    }),
    list_integration_tools: tool({
      description:
        "List the available tool slugs and descriptions for a specific connected app. Call this when you need the exact Composio tool name to use in a workflow core.tool_call node or voice agent toolsEndpoint. Always call list_connected_apps first to confirm the app is connected, then call this to get real tool names.",
      inputSchema: z.object({
        appSlug: z
          .string()
          .describe(
            "The app slug to fetch tools for, e.g. 'slack', 'gmail', 'github', 'googlesheets'.",
          ),
      }),
      execute: async ({ appSlug }) => {
        const tools = await listComposioToolsForApp(appSlug).catch(() => []);
        return { tools };
      },
    }),
  };
}

const submitPlanInputSchema = z.object({
  kind: z.enum(["automation", "voice-agent", "chat-agent", "code"]),
  title: z.string().min(1).max(200),
  trigger: z
    .string()
    .describe("Human-readable trigger description, e.g. 'Daily at 9am UTC'"),
  steps: z.array(
    z.object({
      step: z.number(),
      description: z.string(),
      nodeType: z.string(),
      integration: z.string().optional(),
    }),
  ),
  requirements: z.array(
    z.object({
      type: z.enum(["app", "phone", "kb", "mcp"]),
      name: z.string(),
    }),
  ),
});

function buildSubmitPlanTool(): Tool {
  return tool({
    description:
      "Announce the workflow plan to the user before building. Call once after understanding the request and before gathering requirements or calling workflow_commit. The user sees this as a structured plan card in the chat.",
    inputSchema: submitPlanInputSchema,
    execute: async (input) => ({ ok: true as const, plan: input }),
  });
}

function buildContentBodyTool(): Tool {
  return tool({
    description:
      "Show the user a structured content editor in the chat to compose or review a message body " +
      "(email, Slack post, SMS, etc.) before it is used in a workflow. Call this during Phase 1 — " +
      "Understand — whenever you need the exact body text for a message the workflow will send. " +
      "Provide suggestedSubject/suggestedBody if you can draft the content from context; " +
      "leave them empty to start from a blank form. Wait for the confirmed content before calling workflow_commit.",
    inputSchema: z.object({
      contentType: z.enum(["email", "slack", "sms", "generic"]),
      description: z
        .string()
        .describe(
          "What this content is for, e.g. 'Welcome email to new signups'",
        ),
      suggestedSubject: z.string().optional(),
      suggestedBody: z.string().optional(),
    }),
    execute: async (input) => ({ ok: true as const, ...input }),
  });
}

interface ChatRequestBody {
  readonly id?: string;
  readonly chatId?: string;
  readonly messages?: UIMessage[];
  readonly model?: string;
  readonly builderModel?: string;
  readonly skipUserInsert?: boolean;
  // Document ids the user picked in the chat document UI to scope RAG to.
  readonly ragDocumentIds?: string[];
}

function resolveRagDocumentIds(body: ChatRequestBody): string[] {
  if (!Array.isArray(body.ragDocumentIds)) return [];
  return body.ragDocumentIds.filter(
    (id): id is string => typeof id === "string",
  );
}

// When the user has picked existing documents in the chat, tell Mirrorpilot the
// REAL knowledge base id(s) those documents already live in, so it reuses them
// for any agent/workflow it builds instead of creating a new KB and re-ingesting
// (which wastes embedding cost and time).
function buildKnowledgeSelectionContext(
  docs: readonly ResolvedSelectedDocument[],
): string | undefined {
  if (docs.length === 0) return undefined;
  const kbIds = [...new Set(docs.map((d) => d.kbId))];
  const docIds = docs.map((d) => d.documentId);
  const docLines = docs.map((d) => {
    const label = d.fileName ?? d.sourceUrl ?? "document";
    return `- "${label}" — document id: ${d.documentId}, in knowledge base "${d.kbName}" (id: ${d.kbId})`;
  });
  return [
    "Selected knowledge base documents:",
    "The user has selected specific existing documents to use. They are already ingested and embedded — do NOT call create_knowledge_base or re-ingest them; that wastes cost and time.",
    ...docLines,
    "When you build or edit an agent or workflow that should answer from these documents, copy BOTH of these lines into the intent verbatim:",
    `- knowledgeBaseIds: [${kbIds.join(", ")}]`,
    `- knowledgeDocumentIds: [${docIds.join(", ")}]`,
    "knowledgeBaseIds binds the knowledge base(s); knowledgeDocumentIds scopes the agent to exactly these documents so it ignores other documents in the same knowledge base(s).",
  ].join("\n");
}

function jsonError(status: number, message: string, code?: ErrCode): Response {
  return new Response(
    JSON.stringify({ error: message, ...(code ? { code } : {}) }),
    {
      status,
      headers: { "content-type": "application/json" },
    },
  );
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

  // Privileged connection by design: this route streams the agent response over
  // a long-lived request, so it can't run inside a single request-scoped tenant
  // transaction (which RLS via withTenantContext requires). It pre-resolves the
  // workspace and filters every query by it explicitly. See packages/db/README.
  const db = getDb();
  const workspaceId = await ensureUserWorkspace(db, user.id);

  const rateLimit = await checkRateLimit("chat", `${user.id}:${workspaceId}`);
  if (!rateLimit.ok) return rateLimitedResponse(rateLimit.retryAfterSeconds);

  const chat = await ensureChat(db, { chatId, workspaceId, userId: user.id });
  if (!chat) return jsonError(500, "Failed to ensure chat");

  const activeSubscription = await getActiveSubscription(db, workspaceId).catch(
    (err: unknown) => {
      console.warn(
        "[chat] failed to load active subscription, using default limits:",
        err instanceof Error ? err.message : err,
      );
      return null;
    },
  );
  const chatLimits: ChatLimits = {
    maxMessagesPerChat:
      activeSubscription?.plan.limits.maxMessagesPerChat ??
      DEFAULT_CHAT_LIMITS.maxMessagesPerChat,
    maxCostCentsPerChat:
      activeSubscription?.plan.limits.maxCostCentsPerChat ??
      DEFAULT_CHAT_LIMITS.maxCostCentsPerChat,
  };

  const breach = await chatsService.checkAdmission(
    { db, userId: user.id },
    { chatId: chat.id, limits: chatLimits },
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

  // Workflow generation limit: only checked on the first message of a new chat.
  if (!chat.title) {
    try {
      const genLimit =
        activeSubscription?.plan.limits.maxWorkflowGenerationsPerPeriod ?? null;
      if (genLimit !== null) {
        const periodStart =
          activeSubscription?.subscription.currentPeriodStart ?? new Date(0);
        const generationsUsed = await countGenerationsThisPeriod(
          db,
          workspaceId,
          periodStart,
        );
        if (generationsUsed >= genLimit) {
          return jsonError(
            402,
            "You have reached your plan's workflow generation limit. Please upgrade to continue.",
            ErrCode.PlanLimitReached,
          );
        }
      }
    } catch (err) {
      console.warn(
        "[chat] generation limit check failed, proceeding:",
        err instanceof Error ? err.message : err,
      );
    }
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

  const ragDocumentIds = resolveRagDocumentIds(body);

  const [composioTools, workspaceWebhooks, selectedDocumentKbs] =
    await Promise.all([
      buildComposioTools(db, workspaceId, chat.id).catch((err) => {
        if (env.NODE_ENV === "development") {
          console.error("[chat] failed to build composio tools:", err);
        }
        return {} as Record<string, Tool>;
      }),
      listWorkspaceWebhooks(db, workspaceId).catch(() => []),
      resolveSelectedDocumentKbs(db, workspaceId, ragDocumentIds).catch(
        () => [] as ResolvedSelectedDocument[],
      ),
    ]);

  const firstPartyTools = makeFirstPartyAiTools({
    db,
    workspaceId,
    userId: user.id,
  });
  const phoneTools = buildPhoneTools({ db, workspaceId, userId: user.id });
  const knowledgeTools = buildKnowledgeTools({
    db,
    workspaceId,
    userId: user.id,
    chatId: chat.id,
    ragDocumentIds,
  });
  const introspectionTools = await buildIntrospectionTools(
    db,
    workspaceId,
  ).catch(() => ({}) as Record<string, Tool>);

  const additionalTools = {
    ...firstPartyTools,
    ...composioTools,
    ...phoneTools,
    ...knowledgeTools,
    ...introspectionTools,
    submit_plan: buildSubmitPlanTool(),
    request_content_body: buildContentBodyTool(),
  };

  const webhookContextLines = workspaceWebhooks.map((w) => {
    let line = `- ${w.name}: ${w.url}`;
    if (w.description) line += ` — ${w.description}`;
    return line;
  });
  const contextBlocks: string[] = [];
  if (webhookContextLines.length > 0) {
    contextBlocks.push(
      `Workspace webhooks:\n${webhookContextLines.join("\n")}\nWhen the user asks to call back to their system, trigger an event, or send data to an external endpoint, reference these webhook URLs.`,
    );
  }
  const knowledgeSelectionContext =
    buildKnowledgeSelectionContext(selectedDocumentKbs);
  if (knowledgeSelectionContext) contextBlocks.push(knowledgeSelectionContext);
  const systemPromptSuffix =
    contextBlocks.length > 0 ? contextBlocks.join("\n\n") : undefined;

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

  try {
    await checkCreditQuota(db, workspaceId);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      console.warn(
        `[chat] 402 credit quota exceeded workspaceId=${workspaceId} used=${err.used} limit=${err.limit}`,
      );
      return jsonError(
        402,
        "You have exceeded your plan's credit budget. Please upgrade your plan to continue.",
        ErrCode.QuotaExceeded,
      );
    }
    console.warn(
      "[chat] credit quota check failed, proceeding:",
      err instanceof Error ? err.message : err,
    );
  }

  return runMirrorpilot({
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
      // Flush Langfuse spans before the serverless function terminates.
      await flushTracing();
    },
  });
}
