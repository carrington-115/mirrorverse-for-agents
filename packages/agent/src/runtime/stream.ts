import { randomUUID } from "node:crypto";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { propagateAttributes } from "@langfuse/tracing";

import { breakdownStepUsage } from "../billing";
import { resolveModel } from "../models/resolve";
import { sanitizeToolCallHistory } from "../sanitize-history";
import { MIRRORPILOT_SYSTEM_PROMPT } from "../system-prompt";
import { makeWorkflowCommitTool, WORKFLOW_COMMIT_TOOL_NAME } from "../tools/workflow-commit";

import {
  DEFAULT_MAX_STEPS,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MIRRORPILOT_MODEL,
  LOG_PREFIX,
} from "./constants";
import { makeLifecycleEmitter } from "./lifecycle";
import { buildProviderOptions } from "./provider-options";
import type { RunMirrorpilotDeps } from "./types";

export async function runMirrorpilot(deps: RunMirrorpilotDeps): Promise<Response> {
  const modelId = deps.model ?? DEFAULT_MIRRORPILOT_MODEL;
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
      // All builder narrations are accumulated into ONE reasoning part so the
      // COT collapsible shows a single "Thought" step instead of one per node.
      let progressReasoningId: string | null = null;
      let progressFirstDelta = true;

      const emitProgress = (message: string) => {
        if (!progressReasoningId) {
          progressReasoningId = `progress-${randomUUID()}`;
          progressFirstDelta = true;
          writer.write({ type: "reasoning-start", id: progressReasoningId });
        }
        if (!progressFirstDelta) {
          writer.write({ type: "reasoning-delta", id: progressReasoningId, delta: "\n" });
        }
        progressFirstDelta = false;
        writer.write({ type: "reasoning-delta", id: progressReasoningId, delta: message });
      };

      const finalizeProgress = () => {
        if (progressReasoningId) {
          writer.write({ type: "reasoning-end", id: progressReasoningId });
          progressReasoningId = null;
          progressFirstDelta = true;
        }
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
        ? `${MIRRORPILOT_SYSTEM_PROMPT}\n\n${deps.systemPromptSuffix}`
        : MIRRORPILOT_SYSTEM_PROMPT;

      await propagateAttributes(
        {
          sessionId: deps.chatId,
          userId: deps.userId,
          tags: ["chat", modelId],
        },
        async () => {
          const result = streamText({
            model: resolveModel(modelId),
            system,
            messages: modelMessages,
            tools,
            temperature: 0,
            maxOutputTokens: deps.maxTokens ?? DEFAULT_MAX_TOKENS,
            stopWhen: stepCountIs(deps.maxSteps ?? DEFAULT_MAX_STEPS),
            providerOptions: buildProviderOptions(modelId),
            experimental_telemetry: {
              isEnabled: true,
              functionId: "mirrorpilot-chat",
              metadata: {
                chatId: deps.chatId,
                workspaceId: deps.workspaceId,
              },
            },
            experimental_onToolCallStart: async ({ toolCall }) => {
              await emit({
                kind: "tool_use_started",
                messageId: assistantMessageId,
                toolUseId: toolCall.toolCallId,
                toolName: toolCall.toolName,
              });
            },
            experimental_onToolCallFinish: async ({ toolCall, error }) => {
              // Close the builder narration reasoning part before the tool result
              // lands so the COT shows the part as complete.
              if (toolCall.toolName === WORKFLOW_COMMIT_TOOL_NAME) {
                finalizeProgress();
              }
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

          // Forward native model reasoning so the chain-of-thought timeline shows
          // the model's real thinking interleaved with our builder narration and
          // the acting (tool) steps. Providers that emit a reasoning part even for
          // a trivial one-line answer no longer look out of place: the client
          // co-locates reasoning with acting steps and auto-collapses the panel to
          // a "Thought process" summary once the turn finishes.
          writer.merge(result.toUIMessageStream<UIMessage>({ sendReasoning: true }));
        },
      );
    },
    onError: (error) => {
      console.error(`${LOG_PREFIX} stream response error:`, error);
      return error instanceof Error ? error.message : "Internal error";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
