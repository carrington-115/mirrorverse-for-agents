import type { JsonValue, WorkflowNode } from "@mirrorverse/types";
import type { GetStepTools } from "inngest";
import type { RunState } from "../run-state";

import { inngest } from "../../../inngest/client";

type StepTools = GetStepTools<typeof inngest>;
import type { InterpretResult } from "./types";

interface HumanReviewParams {
  readonly promptTemplate?: string;
  readonly timeoutSec?: number;
  readonly onTimeout?: "abort" | "continue";
  readonly defaultValue?: JsonValue;
}

/**
 * human.review — pauses the run and waits for an external approval signal.
 *
 * The external actor sends an Inngest event `human.review.responded` with
 * `{ stepId: <nodeId>, response: <JsonValue> }` to resume the run.
 */
export async function interpretHumanReview(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
  runId: string,
  step: StepTools,
): Promise<InterpretResult> {
  const params = state.resolveParams(node.params, input) as HumanReviewParams;

  const timeoutMs = (params.timeoutSec ?? 3600) * 1000;
  const onTimeout = params.onTimeout ?? "abort";
  const defaultValue = params.defaultValue ?? null;

  const resumeEvent = await step.waitForEvent(`human-review:${node.id}`, {
    event: "human.review.responded",
    timeout: timeoutMs,
    // Match on the run + node so concurrent runs don't cross-wire.
    if: `event.data.runId == "${runId}" && event.data.nodeId == "${node.id}"`,
  });

  if (!resumeEvent) {
    // Timed out.
    if (onTimeout === "abort") {
      throw new Error(
        `human.review: timed out waiting for approval on node "${node.id}"`,
      );
    }
    // Continue with default value.
    return { output: defaultValue as JsonValue, nextPorts: ["main"] };
  }

  const response = (resumeEvent.data as Record<string, unknown>).response;
  return { output: (response ?? null) as JsonValue, nextPorts: ["main"] };
}
