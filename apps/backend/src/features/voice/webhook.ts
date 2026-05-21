import { timingSafeEqual } from "node:crypto";

import { getDb, schema } from "@mirrorverse/db";
import { env } from "@mirrorverse/env/backend";

import {
  invokeComposioTool,
  NeedsAuthError,
} from "../../mcp/composio/dispatcher";
import * as repo from "./repo";

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

  await repo.insertVoiceCall(db, {
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
    await db
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

  return new Response(JSON.stringify({ received: true }), {
    headers: { "content-type": "application/json" },
  });
}
