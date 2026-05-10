"use client";

import { useState, useCallback, useRef } from "react";
import type {
  AgentMessageData,
  ContentBlock,
  ThinkingBlock,
  TextBlock,
  ToolUseBlock,
} from "@/app/(dashboard)/mirrropilot/_components/agent-message";
import type { ChatPayload } from "@/app/(dashboard)/mirrropilot/_components/chat-input";

// ─────────────────────────────────────────
// SSE event types — mirror the Anthropic SDK
// ─────────────────────────────────────────

interface ContentBlockStartEvent {
  type: "content_block_start";
  index: number;
  content_block: {
    type: "thinking" | "text" | "tool_use";
    id?: string;
    name?: string;
  };
}

interface ContentBlockDeltaEvent {
  type: "content_block_delta";
  index: number;
  delta:
    | { type: "thinking_delta"; thinking: string }
    | { type: "text_delta"; text: string }
    | { type: "input_json_delta"; partial_json: string };
}

interface ContentBlockStopEvent {
  type: "content_block_stop";
  index: number;
}

interface MessageStartEvent {
  type: "message_start";
  message: { id: string };
}

interface MessageDeltaEvent {
  type: "message_delta";
  delta: { stop_reason?: string };
}

interface MessageStopEvent {
  type: "message_stop";
}

interface ToolResultEvent {
  type: "tool_result";
  tool_use_id: string;
  result: string;
  status: "done" | "error";
}

interface ErrorEvent {
  type: "error";
  message: string;
}

type StreamEvent =
  | MessageStartEvent
  | ContentBlockStartEvent
  | ContentBlockDeltaEvent
  | ContentBlockStopEvent
  | MessageDeltaEvent
  | MessageStopEvent
  | ToolResultEvent
  | ErrorEvent;

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────

export function useChatStream(apiUrl: string = "/api/v1/chat/stream") {
  const [messages, setMessages] = useState<AgentMessageData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Helpers ────────────────────────────
  const updateMessage = useCallback(
    (id: string, updater: (msg: AgentMessageData) => AgentMessageData) => {
      setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
    },
    [],
  );

  const updateBlock = useCallback(
    (messageId: string, blockIndex: number, updater: (block: ContentBlock) => ContentBlock) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const blocks = [...m.blocks];
          if (blocks[blockIndex]) {
            blocks[blockIndex] = updater(blocks[blockIndex]);
          }
          return { ...m, blocks };
        }),
      );
    },
    [],
  );

  // ── Main send function ─────────────────
  const send = useCallback(
    async (payload: ChatPayload) => {
      if (isStreaming) return;

      // 1. Add user message immediately
      const userMsgId = crypto.randomUUID();
      const userMsg: AgentMessageData = {
        id: userMsgId,
        role: "user",
        status: "complete",
        blocks: [{ type: "text", content: payload.message }],
        createdAt: new Date(),
      };

      // 2. Add agent message in pending state
      const agentMsgId = crypto.randomUUID();
      const agentMsg: AgentMessageData = {
        id: agentMsgId,
        role: "agent",
        status: "pending",
        blocks: [],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, agentMsg]);
      setIsStreaming(true);

      // 3. Open SSE stream
      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abort.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // 4. Process the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]" || !raw) continue;

            let event: StreamEvent;
            try {
              event = JSON.parse(raw);
            } catch {
              continue;
            }

            dispatch(agentMsgId, event);
          }
        }

        // 5. Mark complete
        updateMessage(agentMsgId, (m) => ({ ...m, status: "complete" }));
      } catch (err: any) {
        if (err.name === "AbortError") {
          // User stopped generation — mark complete with what we have
          updateMessage(agentMsgId, (m) => ({
            ...m,
            status: "complete",
          }));
        } else {
          updateMessage(agentMsgId, (m) => ({ ...m, status: "error" }));
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, apiUrl, updateMessage, updateBlock],
  );

  // ── SSE event dispatcher ───────────────
  const dispatch = useCallback(
    (agentMsgId: string, event: StreamEvent) => {
      switch (event.type) {
        case "message_start": {
          updateMessage(agentMsgId, (m) => ({ ...m, status: "pending" }));
          break;
        }

        case "content_block_start": {
          const { content_block, index } = event;

          if (content_block.type === "thinking") {
            const block: ThinkingBlock = { type: "thinking", content: "", startedAt: Date.now() };
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== agentMsgId) return m;
                const blocks = [...m.blocks];
                blocks[index] = block;
                return { ...m, status: "thinking", blocks };
              }),
            );
          }

          if (content_block.type === "text") {
            const block: TextBlock = { type: "text", content: "" };
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== agentMsgId) return m;
                const blocks = [...m.blocks];
                blocks[index] = block;
                return { ...m, status: "streaming", blocks };
              }),
            );
          }

          if (content_block.type === "tool_use") {
            const block: ToolUseBlock = {
              type: "tool_use",
              toolName: content_block.name ?? "unknown",
              toolId: content_block.id ?? crypto.randomUUID(),
              status: "running",
            };
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== agentMsgId) return m;
                const blocks = [...m.blocks];
                blocks[index] = block;
                return { ...m, status: "tool_use", blocks };
              }),
            );
          }
          break;
        }

        case "content_block_delta": {
          const { delta, index } = event;

          if (delta.type === "thinking_delta") {
            updateBlock(agentMsgId, index, (b) => {
              if (b.type !== "thinking") return b;
              return { ...b, content: b.content + delta.thinking };
            });
          }

          if (delta.type === "text_delta") {
            updateBlock(agentMsgId, index, (b) => {
              if (b.type !== "text") return b;
              return { ...b, content: b.content + delta.text };
            });
          }
          break;
        }

        case "content_block_stop": {
          // If the stopped block was thinking, record duration
          updateBlock(agentMsgId, event.index, (b) => {
            if (b.type !== "thinking") return b;
            return { ...b, durationMs: b.startedAt ? Date.now() - b.startedAt : 0 };
          });
          break;
        }

        case "tool_result": {
          // Update the matching tool_use block with its result
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== agentMsgId) return m;
              const blocks = m.blocks.map((b) => {
                if (b.type !== "tool_use" || b.toolId !== event.tool_use_id) return b;
                return {
                  ...b,
                  result: event.result,
                  status: event.status,
                } satisfies ToolUseBlock;
              });
              return { ...m, blocks, status: "streaming" };
            }),
          );
          break;
        }

        case "message_stop": {
          updateMessage(agentMsgId, (m) => ({ ...m, status: "complete" }));
          break;
        }

        case "error": {
          updateMessage(agentMsgId, (m) => ({ ...m, status: "error" }));
          break;
        }
      }
    },
    [updateMessage, updateBlock],
  );

  // ── Stop streaming ─────────────────────
  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ── Retry ──────────────────────────────
  const retry = useCallback(
    (messageId: string) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === messageId);
        if (idx < 1) return prev;
        const userMsg = prev[idx - 1];
        if (userMsg.role !== "user") return prev;
        const textBlock = userMsg.blocks.find((b): b is TextBlock => b.type === "text");
        if (textBlock) {
          setTimeout(
            () => send({ message: textBlock.content, model: "claude-opus-4-7", context: [] }),
            0,
          );
        }
        return prev.slice(0, idx);
      });
    },
    [send],
  );

  return {
    messages,
    isStreaming,
    send,
    stop,
    retry,
  };
}
