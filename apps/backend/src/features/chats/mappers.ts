import type { UIMessage } from "ai";

import type { AgentLifecycleEvent } from "@mirrorverse/agent";
import type {
  ChatEventPayload,
  ContentBlock,
  MessageId,
} from "@mirrorverse/types";

type TextPart = { type: "text"; text: string };
type ReasoningPart = {
  type: "reasoning";
  text: string;
  providerMetadata?: { anthropic?: { signature?: unknown } };
};
type ToolPart = {
  type: `tool-${string}`;
  toolCallId: string;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function isTextPart(part: unknown): part is TextPart {
  const p = part as { type?: unknown; text?: unknown };
  return p?.type === "text" && typeof p.text === "string";
}

function isReasoningPart(part: unknown): part is ReasoningPart {
  const p = part as { type?: unknown; text?: unknown };
  return p?.type === "reasoning" && typeof p.text === "string";
}

function isToolPart(part: unknown): part is ToolPart {
  const p = part as { type?: unknown; toolCallId?: unknown };
  return (
    typeof p?.type === "string" &&
    p.type.startsWith("tool-") &&
    typeof p.toolCallId === "string"
  );
}

function readSignature(part: ReasoningPart): string {
  const sig = part.providerMetadata?.anthropic?.signature;
  return typeof sig === "string" ? sig : "";
}

function toolNameOf(part: ToolPart): string {
  return part.type.slice("tool-".length);
}

export function uiMessageToContentBlocks(msg: UIMessage): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  for (const part of msg.parts) {
    if (isTextPart(part)) {
      blocks.push({ type: "text", text: part.text } as ContentBlock);
      continue;
    }
    if (isReasoningPart(part)) {
      blocks.push({
        type: "thinking",
        thinking: part.text,
        signature: readSignature(part),
      } as ContentBlock);
      continue;
    }
    if (isToolPart(part)) {
      blocks.push({
        type: "tool_use",
        id: part.toolCallId,
        name: toolNameOf(part),
        input: (part.input ?? {}) as Record<string, unknown>,
      } as ContentBlock);
      // Anthropic requires every `tool_use` to be immediately followed by a
      // `tool_result`. If the stream ended before the part reached a terminal
      // state (mid-run abort, validation retry that never landed), synthesize
      // an error result so the next turn's replay stays valid.
      if (part.state === "output-available") {
        blocks.push({
          type: "tool_result",
          tool_use_id: part.toolCallId,
          content: JSON.stringify(part.output ?? null),
          is_error: false,
        } as ContentBlock);
      } else if (part.state === "output-error") {
        blocks.push({
          type: "tool_result",
          tool_use_id: part.toolCallId,
          content: part.errorText ?? "Tool error",
          is_error: true,
        } as ContentBlock);
      } else {
        blocks.push({
          type: "tool_result",
          tool_use_id: part.toolCallId,
          content: "Tool execution did not complete.",
          is_error: true,
        } as ContentBlock);
      }
    }
  }
  return blocks;
}

export function firstUserText(blocks: readonly ContentBlock[]): string {
  return blocks
    .map((b) => {
      const candidate = b as { type?: string; text?: string };
      return candidate.type === "text" && typeof candidate.text === "string"
        ? candidate.text
        : "";
    })
    .join(" ")
    .trim();
}

export function lifecycleToChatEventPayload(
  event: AgentLifecycleEvent,
): ChatEventPayload {
  const messageId = event.messageId as MessageId;
  switch (event.kind) {
    case "message_started":
      return { kind: "message_started", messageId };
    case "tool_use_started":
      return {
        kind: "tool_use_started",
        messageId,
        toolUseId: event.toolUseId,
        toolName: event.toolName,
      };
    case "tool_use_completed":
      return {
        kind: "tool_use_completed",
        messageId,
        toolUseId: event.toolUseId,
        isError: event.isError,
      };
    case "message_completed":
      return { kind: "message_completed", messageId };
  }
}
