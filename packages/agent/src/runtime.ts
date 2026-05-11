import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { Database } from "@mirrorverse/db";

import { MIRROPILOT_SYSTEM_PROMPT } from "./system-prompt";
import { makeWorkflowCommitTool } from "./tools/workflow-commit";

export interface RunMirropilotDeps {
  readonly db: Database;
  readonly userId: string;
  readonly workspaceId: string;
  readonly chatId: string;
  readonly messages: UIMessage[];
  readonly model?: string;
  readonly maxSteps?: number;
  readonly onFinish?: (event: {
    readonly responseMessage: UIMessage;
    readonly messages: UIMessage[];
  }) => Promise<void> | void;
}

export interface RunMirropilotResult {
  readonly response: Response;
}

const DEFAULT_MODEL = "claude-opus-4-7";
const DEFAULT_MAX_STEPS = 5;

export async function runMirropilot(deps: RunMirropilotDeps): Promise<Response> {
  const modelMessages = await convertToModelMessages(deps.messages);
  const result = streamText({
    model: anthropic(deps.model ?? DEFAULT_MODEL),
    system: MIRROPILOT_SYSTEM_PROMPT,
    messages: modelMessages,
    tools: {
      workflow_commit: makeWorkflowCommitTool({
        db: deps.db,
        userId: deps.userId,
        workspaceId: deps.workspaceId,
        chatId: deps.chatId,
      }),
    },
    stopWhen: stepCountIs(deps.maxSteps ?? DEFAULT_MAX_STEPS),
    providerOptions: {
      anthropic: {
        cacheControl: { type: "ephemeral" },
        sendReasoning: true,
        thinking: { type: "enabled", budgetTokens: 4000 },
      },
    },
    onError: ({ error }) => {
      console.error("[mirropilot] streamText error:", error);
    },
  });

  return result.toUIMessageStreamResponse<UIMessage>({
    originalMessages: deps.messages,
    sendReasoning: true,
    onError: (error) => {
      console.error("[mirropilot] stream response error:", error);
      return error instanceof Error ? error.message : "Internal error";
    },
    onFinish: deps.onFinish
      ? async ({ responseMessage, messages }) => {
          await deps.onFinish?.({ responseMessage, messages });
        }
      : undefined,
  });
}
