"use client";

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
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantThread />
    </AssistantRuntimeProvider>
  );
}
