import type { AgentLifecycleEvent } from "@mirrorverse/agent";
import type { ChatEventPayload, MessageId } from "@mirrorverse/types";

export function lifecycleToPayload(
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
