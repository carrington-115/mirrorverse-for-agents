import { randomUUID } from "node:crypto";

import type { JsonValue, WorkflowNode } from "@mirrorverse/types";
import type { GetStepTools } from "inngest";
import type { Database } from "@mirrorverse/db";
import { schema } from "@mirrorverse/db";
import { env } from "@mirrorverse/env/backend";

import { inngest } from "../../../inngest/client";

type StepTools = GetStepTools<typeof inngest>;
import type { RunState } from "../run-state";
import type { InterpretResult } from "./types";
import { sendReviewEmail } from "../../../notifications/email";
import { sendSlackReview } from "../../../notifications/slack";

interface ReviewChannel {
  readonly kind: "email" | "slack" | "chat";
  readonly email?: string;
  readonly webhookUrl?: string;
}

interface HumanReviewParams {
  readonly channel?: ReviewChannel;
  readonly promptTemplate?: string;
  readonly timeoutSec?: number;
  readonly onTimeout?: "abort" | "continue";
  readonly defaultValue?: JsonValue;
}

export async function interpretHumanReview(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
  runId: string,
  workspaceId: string,
  db: Database,
  step: StepTools,
): Promise<InterpretResult> {
  const params = state.resolveParams(node.params, input) as HumanReviewParams;

  const timeoutMs = (params.timeoutSec ?? 3600) * 1000;
  const onTimeout = params.onTimeout ?? "abort";
  const defaultValue = params.defaultValue ?? null;
  const promptText =
    params.promptTemplate ?? "Please review and approve to continue.";
  const channel = params.channel ?? { kind: "chat" };

  // Attempt to insert a new review token. The unique constraint on (runId, nodeId)
  // makes this idempotent — if the function replays before step.waitForEvent
  // is memoized, the insert returns nothing and we skip re-sending the notification.
  const expiresAt = new Date(Date.now() + timeoutMs);
  const inserted = await db
    .insert(schema.humanReviewTokens)
    .values({
      token: randomUUID(),
      runId,
      nodeId: node.id,
      workspaceId,
      promptText,
      expiresAt,
    })
    .onConflictDoNothing()
    .returning({ token: schema.humanReviewTokens.token });

  if (inserted.length > 0) {
    const reviewUrl = `${env.APP_URL}/review/${inserted[0]!.token}`;

    if (channel.kind === "email" && channel.email) {
      await sendReviewEmail(channel.email, promptText, reviewUrl);
    } else if (channel.kind === "slack" && channel.webhookUrl) {
      await sendSlackReview(channel.webhookUrl, promptText, reviewUrl);
    }
    // channel.kind === "chat": in-app notification deferred
  }

  const resumeEvent = await step.waitForEvent(`human-review:${node.id}`, {
    event: "human.review.responded",
    timeout: timeoutMs,
    if: `event.data.runId == "${runId}" && event.data.nodeId == "${node.id}"`,
  });

  if (!resumeEvent) {
    if (onTimeout === "abort") {
      // Return halt instead of throwing — throwing causes Inngest to burn retries
      // on a memoized null result before the run finally fails.
      return { output: null, nextPorts: [] };
    }
    return { output: defaultValue as JsonValue, nextPorts: ["main"] };
  }

  const response = (resumeEvent.data as Record<string, unknown>).response;
  return { output: (response ?? null) as JsonValue, nextPorts: ["main"] };
}
