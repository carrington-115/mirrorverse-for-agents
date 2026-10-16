import { getDb } from "@mirrorverse/db";
import { env } from "@mirrorverse/env/backend";

import { runSlackAgent } from "./agent-runner";
import { postSlackMessage } from "./client";
import { verifySlackSignature } from "./verify";
import { checkRateLimit } from "../../lib/rate-limit";

interface SlackAppMentionEvent {
  readonly type: "app_mention";
  readonly text: string;
  readonly channel: string;
  readonly ts: string;
  readonly thread_ts?: string;
  readonly bot_id?: string;
}

interface SlackEventCallbackPayload {
  readonly type: "event_callback";
  readonly team_id?: string;
  readonly event:
    | SlackAppMentionEvent
    | { readonly type: string; readonly bot_id?: string };
}

interface SlackUrlVerificationPayload {
  readonly type: "url_verification";
  readonly challenge: string;
}

type SlackPayload =
  | SlackUrlVerificationPayload
  | SlackEventCallbackPayload
  | { readonly type: string };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Strips the leading "<@BOTID>" mention token Slack prepends to app_mention text.
function stripMention(text: string): string {
  return text.replace(/^<@[^>]+>\s*/, "").trim();
}

async function replyToMention(
  event: SlackAppMentionEvent,
  botToken: string,
): Promise<void> {
  try {
    const text = stripMention(event.text);
    const reply = await runSlackAgent(getDb(), text);
    if (!reply) {
      console.log(
        "[slack] no workflow flagged to respond, or it has no ai.agent node",
      );
      return;
    }
    await postSlackMessage(
      botToken,
      event.channel,
      reply,
      event.thread_ts ?? event.ts,
    );
  } catch (err) {
    console.error("[slack] failed to handle app_mention:", err);
  }
}

export async function slackEventsHandler(request: Request): Promise<Response> {
  const rawBody = await request.text();

  const signingSecret = env.SLACK_SIGNING_SECRET;
  const botToken = env.SLACK_BOT_TOKEN;
  if (!signingSecret || !botToken) {
    return jsonResponse({ error: "Slack integration not configured" }, 401);
  }

  const isValid = verifySlackSignature(
    rawBody,
    signingSecret,
    request.headers.get("x-slack-signature"),
    request.headers.get("x-slack-request-timestamp"),
  );
  if (!isValid) {
    return jsonResponse({ error: "invalid signature" }, 401);
  }

  let payload: SlackPayload;
  try {
    payload = JSON.parse(rawBody) as SlackPayload;
  } catch {
    return jsonResponse({ error: "invalid json" }, 400);
  }

  if (payload.type === "url_verification") {
    return jsonResponse({
      challenge: (payload as SlackUrlVerificationPayload).challenge,
    });
  }

  if (payload.type === "event_callback") {
    const { event } = payload as SlackEventCallbackPayload;

    // Slack retries on timeout; ack without reprocessing to avoid duplicate replies.
    if (request.headers.get("x-slack-retry-num")) {
      return jsonResponse({ ok: true });
    }

    if (event.type === "app_mention" && !event.bot_id) {
      // Over the limit: ack without replying. A 429 would only make Slack
      // retry (retries are dropped above) and count against the app's
      // delivery health.
      const { team_id: teamId } = payload as SlackEventCallbackPayload;
      const rateLimit = await checkRateLimit(
        "slackEvents",
        teamId ?? "unknown",
      );
      if (!rateLimit.ok) {
        console.warn(`[slack] rate limited team=${teamId ?? "unknown"}`);
        return jsonResponse({ ok: true });
      }
      void replyToMention(event as SlackAppMentionEvent, botToken);
    }

    return jsonResponse({ ok: true });
  }

  return jsonResponse({ ok: true });
}
