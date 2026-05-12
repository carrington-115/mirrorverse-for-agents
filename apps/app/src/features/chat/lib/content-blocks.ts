import type { UIMessage, UIMessagePart } from "ai";

import type { ChatMessageRow } from "@/features/chat/api/server-types";

type PersistedBlock = {
  type?: string;
  text?: string;
  thinking?: string;
  signature?: string;
};

export function contentBlocksToUIMessage(row: ChatMessageRow): UIMessage {
  const raw = Array.isArray(row.contentBlocks) ? row.contentBlocks : [];
  const parts: UIMessagePart<never, never>[] = [];

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
    }
  }

  return {
    id: row.id,
    role: row.role === "user" ? "user" : "assistant",
    parts,
  };
}
