import { randomUUID } from "node:crypto";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";

import { breakdownStepUsage } from "../billing";
import { resolveModel } from "../models/resolve";
import { sanitizeToolCallHistory } from "../sanitize-history";
import { MIRROPILOT_SYSTEM_PROMPT } from "../system-prompt";
import { makeWorkflowCommitTool } from "../tools/workflow-commit";

import { makeLifecycleEmitter } from "./lifecycle";
import { buildProviderOptions } from "./provider-options";
import type { RunMirropilotDeps } from "./types";

const DEFAULT_MODEL = "claude-haiku-4-5";
const DEFAULT_MAX_STEPS = 2;

export async function runMirropilot(deps: RunMirropilotDeps): Promise<Response> {
  const tools = {
    workflow_commit: makeWorkflowCommitTool({
      db: deps.db,
      userId: deps.userId,
      workspaceId: deps.workspaceId,
      chatId: deps.chatId,
      builderModel: deps.builderModel,
    }),
  };

  const modelId = deps.model ?? DEFAULT_MODEL;
  const rawModelMessages = await convertToModelMessages(deps.messages, { tools });
  const modelMessages = sanitizeToolCallHistory(rawModelMessages);
  const assistantMessageId = randomUUID();
  const emit = makeLifecycleEmitter(deps.onLifecycleEvent);

  console.log(
    `[mirropilot] streamText.start model=${modelId} chatId=${deps.chatId} ` +
      `uiMessages=${deps.messages.length} modelMessages=${modelMessages.length} ` +
      `tools=${Object.keys(tools).length}`,
  );

  await emit({ kind: "message_started", messageId: assistantMessageId });

  const result = streamText({
    model: resolveModel(modelId),
    system: MIRROPILOT_SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(deps.maxSteps ?? DEFAULT_MAX_STEPS),
    providerOptions: buildProviderOptions(modelId),
    experimental_onToolCallStart: async ({ toolCall }) => {
      await emit({
        kind: "tool_use_started",
        messageId: assistantMessageId,
        toolUseId: toolCall.toolCallId,
        toolName: toolCall.toolName,
      });
    },
    experimental_onToolCallFinish: async ({ toolCall, error }) => {
      await emit({
        kind: "tool_use_completed",
        messageId: assistantMessageId,
        toolUseId: toolCall.toolCallId,
        isError: Boolean(error),
      });
    },
    onStepFinish: async ({ text, toolCalls, finishReason, usage }) => {
      const breakdown = breakdownStepUsage(usage, modelId);
      console.log(
        `[mirropilot] step.finish reason=${finishReason} ` +
          `textChars=${text?.length ?? 0} toolCalls=${toolCalls?.length ?? 0} ` +
          `inputTokens=${usage?.inputTokens ?? 0} outputTokens=${usage?.outputTokens ?? 0} ` +
          `cents=${breakdown.totalCostCents}`,
      );
      if (deps.onUsage && breakdown.entries.length > 0) {
        await deps.onUsage({ model: modelId, breakdown });
      }
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
      await emit({ kind: "message_completed", messageId: assistantMessageId });
      if (deps.onFinish) {
        await deps.onFinish({ responseMessage, messages });
      }
    },
  });
}
