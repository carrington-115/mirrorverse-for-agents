import type { UIMessage, UIMessagePart } from "ai";

import type { ChatMessageRow } from "@/features/chat/api/server-types";

type PersistedBlock = {
  type?: string;
  text?: string;
  thinking?: string;
  signature?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
};

interface PendingToolUse {
  readonly name: string;
  readonly input: unknown;
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function contentBlocksToUIMessage(row: ChatMessageRow): UIMessage {
  const raw = Array.isArray(row.contentBlocks) ? row.contentBlocks : [];
  const parts: UIMessagePart<never, never>[] = [];
  const pendingToolUses = new Map<string, PendingToolUse>();

  for (const block of raw) {
    if (!block || typeof block !== "object") continue;
    const b = block as PersistedBlock;

    if (b.type === "text" && typeof b.text === "string") {
      parts.push({ type: "text", text: b.text });
      continue;
    }

    if (b.type === "thinking" && typeof b.thinking === "string") {
      const signed = typeof b.signature === "string" && b.signature.length > 0;
      parts.push({
        type: "reasoning",
        text: b.thinking,
        ...(signed ? { providerMetadata: { anthropic: { signature: b.signature } } } : {}),
      });
      continue;
    }

    if (b.type === "tool_use" && typeof b.id === "string" && typeof b.name === "string") {
      pendingToolUses.set(b.id, { name: b.name, input: b.input });
      continue;
    }

    if (b.type === "tool_result" && typeof b.tool_use_id === "string") {
      const use = pendingToolUses.get(b.tool_use_id);
      if (!use) continue;
      pendingToolUses.delete(b.tool_use_id);
      const isError = b.is_error === true;
      const partType = `tool-${use.name}` as `tool-${string}`;
      if (isError) {
        parts.push({
          type: partType,
          toolCallId: b.tool_use_id,
          state: "output-error",
          input: use.input,
          errorText: typeof b.content === "string" ? b.content : "Tool error",
        } as UIMessagePart<never, never>);
      } else {
        parts.push({
          type: partType,
          toolCallId: b.tool_use_id,
          state: "output-available",
          input: use.input,
          output: tryParseJson(b.content),
        } as UIMessagePart<never, never>);
      }
    }
  }

  for (const [toolCallId, { name, input }] of pendingToolUses) {
    parts.push({
      type: `tool-${name}` as `tool-${string}`,
      toolCallId,
      state: "input-available",
      input,
    } as UIMessagePart<never, never>);
  }

  return {
    id: row.id,
    role: row.role === "user" ? "user" : "assistant",
    parts,
  };
}
