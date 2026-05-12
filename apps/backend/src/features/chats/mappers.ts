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

function isTextPart(part: unknown): part is TextPart {
  const p = part as { type?: unknown; text?: unknown };
  return p?.type === "text" && typeof p.text === "string";
}

function isReasoningPart(part: unknown): part is ReasoningPart {
  const p = part as { type?: unknown; text?: unknown };
  return p?.type === "reasoning" && typeof p.text === "string";
}

function readSignature(part: ReasoningPart): string {
  const sig = part.providerMetadata?.anthropic?.signature;
  return typeof sig === "string" ? sig : "";
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
