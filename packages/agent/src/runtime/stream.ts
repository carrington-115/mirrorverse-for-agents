import { randomUUID } from "node:crypto";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import { breakdownStepUsage } from "../billing";
import { resolveModel } from "../models/resolve";
import { sanitizeToolCallHistory } from "../sanitize-history";
import { MIRROPILOT_SYSTEM_PROMPT } from "../system-prompt";
import { makeWorkflowCommitTool, WORKFLOW_COMMIT_TOOL_NAME } from "../tools/workflow-commit";

import { DEFAULT_MAX_STEPS, DEFAULT_MIRROPILOT_MODEL, LOG_PREFIX } from "./constants";
import { makeLifecycleEmitter } from "./lifecycle";
import { buildProviderOptions } from "./provider-options";
import type { RunMirropilotDeps } from "./types";

export async function runMirropilot(deps: RunMirropilotDeps): Promise<Response> {
  const modelId = deps.model ?? DEFAULT_MIRROPILOT_MODEL;
  const rawModelMessages = await convertToModelMessages(deps.messages, {
    tools: {
      [WORKFLOW_COMMIT_TOOL_NAME]: makeWorkflowCommitTool({
        db: deps.db,
        userId: deps.userId,
        workspaceId: deps.workspaceId,
        chatId: deps.chatId,
        builderModel: deps.builderModel,
      }),
      ...deps.additionalTools,
    },
  });
  const modelMessages = sanitizeToolCallHistory(rawModelMessages);
  const assistantMessageId = randomUUID();
  const emit = makeLifecycleEmitter(deps.onLifecycleEvent);

  console.log(
    `${LOG_PREFIX} streamText.start model=${modelId} chatId=${deps.chatId} ` +
      `uiMessages=${deps.messages.length} modelMessages=${modelMessages.length}`,
  );

  await emit({ kind: "message_started", messageId: assistantMessageId });

  const stream = createUIMessageStream<UIMessage>({
    originalMessages: deps.messages,
    onFinish: async ({ responseMessage, messages }) => {
      console.log(
        `${LOG_PREFIX} stream.finish responseParts=${responseMessage.parts.length} ` +
          `totalMessages=${messages.length} ` +
          `partTypes=${responseMessage.parts.map((p) => p.type).join(",")}`,
      );
      await emit({ kind: "message_completed", messageId: assistantMessageId });
      if (deps.onFinish) {
        await deps.onFinish({ responseMessage, messages });
      }
    },
    execute: async ({ writer }) => {
      // Builder progress streams as reasoning parts so it surfaces in the
      // existing collapsible Reasoning UI alongside any native model reasoning.
      const emitProgress = (message: string) => {
        const id = `progress-${randomUUID()}`;
        writer.write({ type: "reasoning-start", id });
        writer.write({ type: "reasoning-delta", id, delta: message });
        writer.write({ type: "reasoning-end", id });
      };

      const tools = {
        [WORKFLOW_COMMIT_TOOL_NAME]: makeWorkflowCommitTool({
          db: deps.db,
          userId: deps.userId,
          workspaceId: deps.workspaceId,
          chatId: deps.chatId,
          builderModel: deps.builderModel,
          onProgress: emitProgress,
        }),
        ...deps.additionalTools,
      };

      const system = deps.systemPromptSuffix
        ? `${MIRROPILOT_SYSTEM_PROMPT}\n\n${deps.systemPromptSuffix}`
        : MIRROPILOT_SYSTEM_PROMPT;

      const result = streamText({
        model: resolveModel(modelId),
        system,
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
            `${LOG_PREFIX} step.finish reason=${finishReason} ` +
              `textChars=${text?.length ?? 0} toolCalls=${toolCalls?.length ?? 0} ` +
              `inputTokens=${usage?.inputTokens ?? 0} outputTokens=${usage?.outputTokens ?? 0} ` +
              `cents=${breakdown.totalCostCents}`,
          );
          if (deps.onUsage && breakdown.entries.length > 0) {
            await deps.onUsage({ model: modelId, breakdown });
          }
        },
        onError: ({ error }) => {
          console.error(`${LOG_PREFIX} streamText error:`, error);
        },
      });

      // We deliberately do NOT forward native model reasoning. Different
      // providers (notably OpenAI o-series, gpt-5-nano) emit reasoning parts
      // even for trivial answers like a one-line clarifying question, which
      // surfaces as a lonely entry in the chain-of-thought panel. Only our
      // builder narration (written directly to the writer above) belongs in
      // chain-of-thought; the model's own answers belong in regular text.
      writer.merge(result.toUIMessageStream<UIMessage>({ sendReasoning: false }));
    },
    onError: (error) => {
      console.error(`${LOG_PREFIX} stream response error:`, error);
      return error instanceof Error ? error.message : "Internal error";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
