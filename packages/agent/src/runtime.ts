import { randomUUID } from "node:crypto";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import type { Database } from "@mirrorverse/db";

import { MIRROPILOT_SYSTEM_PROMPT } from "./system-prompt";
import { makeWorkflowCommitTool } from "./tools/workflow-commit";
import { breakdownStepUsage, type StepUsageBreakdown } from "./billing";
import { providerForModel, resolveModel } from "./models/resolve";
import { sanitizeToolCallHistory } from "./sanitize-history";

export type AgentLifecycleEvent =
  | { readonly kind: "message_started"; readonly messageId: string }
  | {
      readonly kind: "tool_use_started";
      readonly messageId: string;
      readonly toolUseId: string;
      readonly toolName: string;
    }
  | {
      readonly kind: "tool_use_completed";
      readonly messageId: string;
      readonly toolUseId: string;
      readonly isError: boolean;
    }
  | { readonly kind: "message_completed"; readonly messageId: string };

export interface RunMirropilotDeps {
  readonly db: Database;
  readonly userId: string;
  readonly workspaceId: string;
  readonly chatId: string;
  readonly messages: UIMessage[];
  readonly model?: string;
  readonly builderModel?: string;
  readonly maxSteps?: number;
  readonly onUsage?: (event: {
    readonly model: string;
    readonly breakdown: StepUsageBreakdown;
  }) => Promise<void> | void;
  readonly onLifecycleEvent?: (event: AgentLifecycleEvent) => Promise<void> | void;
  readonly onFinish?: (event: {
    readonly responseMessage: UIMessage;
    readonly messages: UIMessage[];
  }) => Promise<void> | void;
}

export interface RunMirropilotResult {
  readonly response: Response;
}

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

  const emit = async (event: AgentLifecycleEvent): Promise<void> => {
    if (!deps.onLifecycleEvent) return;
    try {
      await deps.onLifecycleEvent(event);
    } catch (err) {
      console.error("[mirropilot] lifecycle event handler failed:", err);
    }
  };

  console.log(
    `[mirropilot] streamText.start model=${modelId} chatId=${deps.chatId} ` +
      `uiMessages=${deps.messages.length} modelMessages=${modelMessages.length} ` +
      `tools=${Object.keys(tools).length}`,
  );

  await emit({ kind: "message_started", messageId: assistantMessageId });

  const provider = providerForModel(modelId);
  // Opus 4.x rejects `thinking.type: "enabled"` — it uses an adaptive thinking
  // API gated by `output_config.effort`. Easiest reliable path is to disable
  // explicit thinking for Opus and let the model run normally. Haiku and
  // Sonnet 4.5/4.6 accept the standard enabled-budget form.
  const supportsEnabledThinking = provider === "anthropic" && !modelId.startsWith("claude-opus-");
  const providerOptions =
    provider === "anthropic"
      ? {
          anthropic: {
            cacheControl: { type: "ephemeral" as const },
            sendReasoning: true,
            ...(supportsEnabledThinking
              ? { thinking: { type: "enabled" as const, budgetTokens: 8000 } }
              : {}),
          },
        }
      : undefined;

  const result = streamText({
    model: resolveModel(modelId),
    system: MIRROPILOT_SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(deps.maxSteps ?? DEFAULT_MAX_STEPS),
    providerOptions,
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
