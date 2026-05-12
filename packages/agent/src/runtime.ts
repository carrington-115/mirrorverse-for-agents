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

const DEFAULT_MODEL = "claude-haiku-4-5";
const DEFAULT_MAX_STEPS = 5;

export async function runMirropilot(deps: RunMirropilotDeps): Promise<Response> {
  const tools = {
    workflow_commit: makeWorkflowCommitTool({
      db: deps.db,
      userId: deps.userId,
      workspaceId: deps.workspaceId,
      chatId: deps.chatId,
    }),
  };

  const modelId = deps.model ?? DEFAULT_MODEL;
  const modelMessages = await convertToModelMessages(deps.messages, { tools });

  console.log(
    `[mirropilot] streamText.start model=${modelId} chatId=${deps.chatId} ` +
      `uiMessages=${deps.messages.length} modelMessages=${modelMessages.length} ` +
      `tools=${Object.keys(tools).length}`,
  );

  const result = streamText({
    model: anthropic(modelId),
    system: MIRROPILOT_SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(deps.maxSteps ?? DEFAULT_MAX_STEPS),
    providerOptions: {
      anthropic: {
        cacheControl: { type: "ephemeral" },
        sendReasoning: true,
        thinking: { type: "enabled", budgetTokens: 8000 },
      },
    },
    onStepFinish: ({ text, toolCalls, finishReason, usage }) => {
      console.log(
        `[mirropilot] step.finish reason=${finishReason} ` +
          `textChars=${text?.length ?? 0} toolCalls=${toolCalls?.length ?? 0} ` +
          `inputTokens=${usage?.inputTokens ?? 0} outputTokens=${usage?.outputTokens ?? 0}`,
      );
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
    onFinish: async ({ responseMessage, messages }) => {
      console.log(
        `[mirropilot] stream.finish responseParts=${responseMessage.parts.length} ` +
          `totalMessages=${messages.length} ` +
          `partTypes=${responseMessage.parts.map((p) => p.type).join(",")}`,
      );
      if (deps.onFinish) {
        await deps.onFinish({ responseMessage, messages });
      }
    },
  });
}
