import type { ModelMessage } from "ai";

type AssistantContent = Extract<ModelMessage, { role: "assistant" }>["content"];

function stripToolPartsFromAssistant(content: AssistantContent): AssistantContent {
  if (typeof content === "string") return content;
  return content.filter((p) => p.type !== "tool-call" && p.type !== "tool-result");
}

/**
 * Strips historical tool-call and tool-result content from prior assistant /
 * tool turns before they're sent to the model provider.
 *
 * Why: the conversational orchestrator only needs prior assistant *text* (and
 * thinking, where applicable) as context. The tool-call/tool-result history is
 * meaningful only inside the turn that produced it — past tool round-trips
 * carry no information the assistant's text summary doesn't already cover.
 *
 * Keeping them around opens a class of bugs around Anthropic's strict
 * "tool_use must be immediately followed by tool_result" rule. Cross-message
 * merging in the provider and edge cases like validation-retry tool calls or
 * mid-run aborts can produce orphan `tool_use` blocks that Anthropic rejects.
 * Stripping them up front eliminates the whole class.
 *
 * Side effect: assistant messages whose only content was a tool-call are
 * dropped entirely (no remaining content blocks).
 */
export function sanitizeToolCallHistory(messages: ModelMessage[]): ModelMessage[] {
  const out: ModelMessage[] = [];
  for (const msg of messages) {
    if (msg.role === "tool") continue;
    if (msg.role !== "assistant") {
      out.push(msg);
      continue;
    }
    const stripped = stripToolPartsFromAssistant(msg.content);
    if (typeof stripped !== "string" && stripped.length === 0) continue;
    out.push({ ...msg, content: stripped });
  }
  return out;
}
