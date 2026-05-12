"use client";

import { useMemo } from "react";

import { useChatQuery } from "@/features/chat/api/queries";
import { contentBlocksToUIMessage } from "@/features/chat/lib/content-blocks";

import { ChatRuntime } from "./chat-runtime";
import { ChatSkeleton } from "./chat-skeleton";

interface ChatShellProps {
  sessionId: string;
}

export function ChatShell({ sessionId }: ChatShellProps) {
  const { data, isLoading } = useChatQuery(sessionId);

  const initialMessages = useMemo(
    () => (data ? data.messages.map(contentBlocksToUIMessage) : []),
    [data],
  );

  if (isLoading || !data) return <ChatSkeleton />;

  return <ChatRuntime sessionId={sessionId} initialMessages={initialMessages} />;
}
