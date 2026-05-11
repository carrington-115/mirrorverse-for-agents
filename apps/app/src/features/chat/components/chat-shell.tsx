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
import { RecommendationCard } from "./recommendation-card";

const RECOMMENDATIONS = [
  {
    title: "Lead Qualification Agent",
    description:
      "Qualifies inbound leads from any channel, asks discovery questions, books meetings via Calendly, and updates Salesforce automatically.",
  },
  {
    title: "Expense Approval bots",
    description:
      "Processes employee expense requests, verifies receipts, checks policy limits, approves small amounts or escalates to finance.",
  },
  {
    title: "HR assistant",
    description:
      "Guides new hires through paperwork, benefits questions, and team intros while creating tasks in Asana and notifying HR.",
  },
] as const;
import { useMemo } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/lib/trpc/client";
import { useChatQuery } from "@/features/chat/api/queries";
import type { ChatMessageRow } from "@/features/chat/api/server-types";
import { AssistantThread } from "./assistant-thread";
import { ChatSkeleton } from "./chat-skeleton";

type UITextPart = { type: "text"; text: string };
type UIMessage = {
  id: string;
  role: "user" | "assistant";
  parts: UITextPart[];
};

function toUIMessage(row: ChatMessageRow): UIMessage {
  const raw = Array.isArray(row.contentBlocks) ? row.contentBlocks : [];
  const parts: UITextPart[] = [];
  for (const block of raw) {
    if (!block || typeof block !== "object") continue;
    const b = block as { type?: string; text?: string };
    if (b.type === "text" && typeof b.text === "string") {
      parts.push({ type: "text", text: b.text });
    }
  }
  return {
    id: row.id,
    role: row.role === "user" ? "user" : "assistant",
    parts,
  };
}

interface ChatShellProps {
  sessionId: string;
}

export function ChatShell({ sessionId }: ChatShellProps) {
  const { data, isLoading } = useChatQuery(sessionId);

  if (isLoading || !data) {
    return <ChatSkeleton />;
  }

  return <ChatRuntime sessionId={sessionId} initialMessages={data.messages.map(toUIMessage)} />;
}

function ChatRuntime({
  sessionId,
  initialMessages,
}: {
  sessionId: string;
  initialMessages: UIMessage[];
}) {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const runtime = useChatRuntime({
    id: sessionId,
    messages: useMemo(() => initialMessages, [initialMessages]),
    onFinish: () => {
      qc.invalidateQueries({ queryKey: trpc.chats.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.chats.get.queryKey({ chatId: sessionId }) });
    },
  });

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
              <div className="gap-5 flex w-full">
                {RECOMMENDATIONS.map((rec) => (
                  <RecommendationCard
                    key={rec.title}
                    title={rec.title}
                    description={rec.description}
                    onClick={() =>
                      handleSend({ message: rec.title, model: "claude-opus-4-7", context: [] })
                    }
                  />
                ))}
              </div>
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
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantThread />
    </AssistantRuntimeProvider>
  );
}
