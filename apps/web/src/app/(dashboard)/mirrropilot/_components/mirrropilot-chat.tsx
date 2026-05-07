"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import ChatInput, { type ChatPayload } from "@/app/(dashboard)/mirrropilot/_components/chat-input";
import {
  AgentMessage,
  type TextBlock,
} from "@/app/(dashboard)/mirrropilot/_components/agent-message";
import { UserMessage } from "@/app/(dashboard)/mirrropilot/_components/user-message";
import { useChatStream } from "../../../../hooks/use-chat-stream";
import mirrropilotIcon from "@/assets/mirrropilot-icon.svg";

interface MessageListProps {
  messages: ReturnType<typeof useChatStream>["messages"];
  onEdit: (messageId: string, newContent: string) => void;
  onRetry: (messageId: string) => void;
}

function MessageList({ messages, onEdit, onRetry }: MessageListProps) {
  return (
    <div className="gap-6 flex flex-col">
      {messages.map((msg) => {
        if (msg.role === "user") {
          const textContent = msg.blocks
            .filter((b): b is TextBlock => b.type === "text")
            .map((b) => b.content)
            .join("");

          return (
            <UserMessage
              key={msg.id}
              content={textContent}
              onEdit={(newContent) => onEdit(msg.id, newContent)}
            />
          );
        }

        return <AgentMessage key={msg.id} message={msg} onRetry={onRetry} />;
      })}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT: MirrropilotChat
// ─────────────────────────────────────────

interface MirrropilotChatProps {
  sessionId: string;
}

export function MirrropilotChat({ sessionId }: MirrropilotChatProps) {
  const { messages, isStreaming, send, stop, retry } = useChatStream(
    `/api/v1/chat/stream?sessionId=${sessionId}`,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  // ── Auto-scroll while streaming ────────
  useEffect(() => {
    if (!isStreaming) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  // ── Scroll to bottom on new user message
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  // ── Edit: resend from that point ───────
  const handleEdit = useCallback(
    (messageId: string, newContent: string) => {
      // Truncate messages up to and including this user message,
      // then re-send with the edited content
      // (useChatStream's retry handles truncation — extend as needed)
      send({ message: newContent, mode: "orchestrate", context: [] });
    },
    [send],
  );

  // ── Handle send ───────────────────────
  const handleSend = useCallback(
    (payload: ChatPayload) => {
      send(payload);
    },
    [send],
  );

  return (
    <div className="relative flex size-full flex-col">
      <div
        ref={scrollRef}
        className={cn("flex-1 overflow-y-auto", !hasMessages && "flex flex-col")}
      >
        {!hasMessages ? (
          <div className="flex size-full items-center justify-center">
            <div className="flex w-full flex-col items-center gap-(--lg)">
              <div className="flex items-center gap-(--sm)">
                <Image src={mirrropilotIcon} alt="Mirrropilot" width={64} height={64} />
                <h1 className="font-bold text-[48px]">Mirrropilot</h1>
              </div>
              <ChatInput
                placeholder="Ask Mirrropilot"
                isStreaming={isStreaming}
                onSend={handleSend}
                onStop={stop}
                className={cn("border border-[rgba(0,0,0,0.05)]")}
              />
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[780px]">
            <MessageList messages={messages} onEdit={handleEdit} onRetry={retry} />
            <div ref={bottomRef} className="h-4" aria-hidden />
          </div>
        )}
      </div>

      {hasMessages && (
        <div className="flex w-full items-center justify-center">
          <ChatInput
            placeholder="Ask Mirrropilot"
            isStreaming={isStreaming}
            onSend={handleSend}
            onStop={stop}
            className={cn("w-[60%] border-2 border-[rgba(0,0,0,0.05)]")}
          />
        </div>
      )}
    </div>
  );
}
