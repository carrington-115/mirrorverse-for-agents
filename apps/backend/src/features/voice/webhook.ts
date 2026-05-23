import { timingSafeEqual } from "node:crypto";

import {
  getDb,
  schema,
  withTenantContext,
  type Database,
} from "@mirrorverse/db";
import { env } from "@mirrorverse/env/backend";

import {
  invokeComposioTool,
  NeedsAuthError,
} from "../../mcp/composio/dispatcher";
import * as knowledgeRepo from "../knowledge/repo";
import {
  searchAcrossKnowledgeBases,
  type CrossKbSearchResult,
} from "../knowledge/search";
import { KNOWLEDGE_SEARCH_TOOL_NAME } from "./compile";
import * as repo from "./repo";

type VoiceAgentRow = NonNullable<
  Awaited<ReturnType<typeof repo.getVoiceAgentByExternalAssistantId>>
>;

const MAX_SPEECH_CHARS = 1200;

// Renders retrieved chunks as compact plain text the model can read aloud —
// no JSON, no scores, source-attributed, and length-capped so TTS doesn't read
// pages of text back to the caller.
function formatHitsForSpeech(hits: CrossKbSearchResult[]): string {
  if (hits.length === 0) {
    return "I couldn't find anything about that in our records.";
  }
  const parts: string[] = [];
  let total = 0;
  for (const h of hits) {
    const source = h.fileName ?? h.sourceUrl ?? "document";
    const excerpt = h.content.replace(/\s+/g, " ").trim();
    const line = `${excerpt} (from ${source})`;
    if (parts.length > 0 && total + line.length > MAX_SPEECH_CHARS) break;
    parts.push(line);
    total += line.length;
  }
  return parts.join("\n\n");
}

// First-party RAG handler. Re-validates the agent's configured KB ids against
// its workspace every call (never trusts ids baked into the workflow doc), then
// runs the cross-KB pgvector search.
async function runKnowledgeSearch(
  db: Database,
  agent: VoiceAgentRow,
  args: Record<string, unknown>,
): Promise<string> {
  const cfg = agent.voiceConfig;
  const kbIds = cfg?.knowledgeBaseIds ?? [];
  if (kbIds.length === 0) return "No knowledge base is configured.";

  const ownedKbIds = await knowledgeRepo.filterKbIdsByWorkspace(
    db,
    [...kbIds],
    agent.workspaceId,
  );
  if (ownedKbIds.length === 0) return "No knowledge base is configured.";

  // Optional document-level scoping: when the agent was deployed to answer from
  // specific documents, restrict retrieval to those (re-validated against the
  // workspace). Strict by design — if none survive (e.g. the documents were
  // deleted), we say we found nothing rather than silently widening the search
  // to the rest of the knowledge base.
  const docIds = cfg?.knowledgeDocumentIds ?? [];
  let ownedDocIds: string[] | undefined;
  if (docIds.length > 0) {
    ownedDocIds = await knowledgeRepo.filterDocumentIdsByWorkspace(
      db,
      [...docIds],
      agent.workspaceId,
    );
    if (ownedDocIds.length === 0) return formatHitsForSpeech([]);
  }

  const query = typeof args.query === "string" ? args.query.trim() : "";
  if (!query) return "No search query was provided.";

  const topK =
    typeof args.topK === "number" && Number.isFinite(args.topK)
      ? Math.min(Math.max(Math.trunc(args.topK), 1), 20)
      : (cfg?.retrieval?.topK ?? 6);

  const hits = await searchAcrossKnowledgeBases(
    db,
    ownedKbIds,
    query,
    topK,
    cfg?.retrieval?.minScore,
    ownedDocIds,
  );
  return formatHitsForSpeech(hits);
}

interface VapiToolCallMessage {
  type: "tool-calls";
  call: { assistantId: string };
  toolCallList: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
}

interface VapiEndOfCallMessage {
  type: "end-of-call-report";
  call: {
    id: string;
    assistantId: string;
    type: "inboundPhoneCall" | "outboundPhoneCall";
    customer?: { number: string };
    phoneNumber?: { number: string };
    startedAt?: string;
    endedAt?: string;
    endedReason?: string;
  };
  durationSeconds?: number;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  cost?: number;
}

type VapiMessage =
  | VapiToolCallMessage
  | VapiEndOfCallMessage
  | { type: string };

function verifySecret(incoming: string | null): boolean {
  const secret = env.VAPI_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!incoming) return false;

  try {
    return timingSafeEqual(Buffer.from(incoming), Buffer.from(secret));
  } catch {
    return false;
  }
}

export async function vapiWebhookHandler(req: Request): Promise<Response> {
  const body = await req.text();

  if (!verifySecret(req.headers.get("x-vapi-secret"))) {
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let message: VapiMessage;
  try {
    const parsed = JSON.parse(body) as { message?: VapiMessage };
    message = parsed.message ?? (parsed as VapiMessage);
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (message.type === "tool-calls") {
    return handleToolCalls(message as VapiToolCallMessage);
  }

  if (message.type === "end-of-call-report") {
    return handleEndOfCall(message as VapiEndOfCallMessage);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "content-type": "application/json" },
  });
}

async function handleToolCalls(
  message: VapiToolCallMessage,
): Promise<Response> {
  const db = getDb();
  const agent = await repo.getVoiceAgentByExternalAssistantId(
    db,
    message.call.assistantId,
  );

  if (!agent) {
    return new Response(
      JSON.stringify({
        results: message.toolCallList.map((tc) => ({
          toolCallId: tc.id,
          result: "Agent not found",
        })),
      }),
      { headers: { "content-type": "application/json" } },
    );
  }

  const results = await Promise.all(
    message.toolCallList.map(async (tc) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      } catch {
        // ignore malformed args
      }

      // First-party RAG tool routes here (its server.url is this webhook), not
      // to Composio.
      if (tc.function.name === KNOWLEDGE_SEARCH_TOOL_NAME) {
        try {
          return {
            toolCallId: tc.id,
            result: await withTenantContext(agent.workspaceId, (tdb) =>
              runKnowledgeSearch(tdb, agent, args),
            ),
          };
        } catch {
          return {
            toolCallId: tc.id,
            result: "I had trouble searching our records just now.",
          };
        }
      }

      try {
        const result = await invokeComposioTool(
          tc.function.name,
          args,
          agent.workspaceId,
        );
        return {
          toolCallId: tc.id,
          result: typeof result === "string" ? result : JSON.stringify(result),
        };
      } catch (err) {
        if (err instanceof NeedsAuthError) {
          return {
            toolCallId: tc.id,
            result:
              "I&apos;m sorry, I&apos;m not able to complete that action right now because a required authorization is missing. Please try again later.",
          };
        }
        return {
          toolCallId: tc.id,
          result:
            "I encountered an error completing that request. Please try again.",
        };
      }
    }),
  );

  return new Response(JSON.stringify({ results }), {
    headers: { "content-type": "application/json" },
  });
}

async function handleEndOfCall(
  message: VapiEndOfCallMessage,
): Promise<Response> {
  const db = getDb();
  const agent = await repo.getVoiceAgentByExternalAssistantId(
    db,
    message.call.assistantId,
  );
  if (!agent) {
    return new Response(JSON.stringify({ received: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  const durationSec = message.durationSeconds ?? null;
  const isOutbound = message.call.type === "outboundPhoneCall";
  const fromNumber = isOutbound
    ? (message.call.phoneNumber?.number ?? "")
    : (message.call.customer?.number ?? "");
  const toNumber = isOutbound
    ? (message.call.customer?.number ?? "")
    : (message.call.phoneNumber?.number ?? "");
  const startedAt = message.call.startedAt
    ? new Date(message.call.startedAt)
    : new Date();
  const endedAt = message.call.endedAt
    ? new Date(message.call.endedAt)
    : new Date();
  const costCents = message.cost ? Math.round(message.cost * 100) : 0;

  // Persist the call + usage inside the tenant transaction (RLS-scoped to the
  // agent's workspace). The agent lookup above runs on the privileged
  // connection because it's keyed by the external assistant id, not workspace.
  await withTenantContext(agent.workspaceId, async (tdb) => {
    await repo.insertVoiceCall(tdb, {
      workspaceId: agent.workspaceId,
      voiceAgentId: agent.id,
      phoneNumberId: null,
      externalCallId: message.call.id,
      direction: isOutbound ? "outbound" : "inbound",
      fromNumber,
      toNumber,
      status: "completed",
      startedAt,
      endedAt,
      durationSec,
      transcriptUrl: null,
      recordingUrl: message.recordingUrl ?? null,
      summary: message.summary ?? null,
      costCents,
      endedReason: message.call.endedReason ?? null,
    });

    if (durationSec && durationSec > 0) {
      const voiceMinutes = Math.ceil(durationSec / 60);
      await tdb
        .insert(schema.usageEvents)
        .values({
          workspaceId: agent.workspaceId,
          kind: "voice_minute",
          quantity: voiceMinutes,
          unit: "minute",
          costCents: Math.round(voiceMinutes * 5),
          billable: true,
          idempotencyKey: `voice_call:${message.call.id}:minutes`,
        })
        .onConflictDoNothing();
    }
  });

  return new Response(JSON.stringify({ received: true }), {
    headers: { "content-type": "application/json" },
  });
}
