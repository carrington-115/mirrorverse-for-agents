"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import mirropilotIcon from "@/assets/mirropilot-icon.svg";
import { useChatStream } from "@/features/chat/hooks/use-chat-stream";
import type { TextBlock } from "@/features/chat/api/types";
import { chatStreamUrl } from "@/features/chat/api/endpoints";
import { ChatInput, type ChatPayload } from "./chat-input";
import { AgentMessage } from "./agent-message";
import { UserMessage } from "./user-message";

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

interface ChatShellProps {
  sessionId: string;
}

export function ChatShell({ sessionId }: ChatShellProps) {
  const { messages, isStreaming, send, stop, retry } = useChatStream(chatStreamUrl(sessionId));

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!isStreaming) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  const handleEdit = useCallback(
    (_messageId: string, newContent: string) => {
      send({ message: newContent, model: "claude-opus-4-7", context: [] });
    },
    [send],
  );

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
                <Image src={mirropilotIcon} alt="Mirropilot" width={64} height={64} />
                <h1 className="font-bold text-[48px]">Mirropilot</h1>
              </div>
              <ChatInput
                placeholder="Ask Mirropilot"
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
            placeholder="Ask Mirropilot"
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
