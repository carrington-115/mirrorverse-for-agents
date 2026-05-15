"use client";

import { useMemo } from "react";

import { useChatQuery } from "@/features/chat/api/queries";
import { contentBlocksToUIMessage } from "@/features/chat/lib/content-blocks";

import { ChatRuntime } from "./chat-runtime";
import { ChatSkeleton } from "./chat-skeleton";
import { ChatWorkflowSidePanel } from "./chat-workflow-side-panel";

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

  const workflowId = data.chat?.workflowId ?? null;

  if (!workflowId) {
    return (
      <div className="mx-auto flex h-full w-full max-w-[860px] flex-col">
        <ChatRuntime sessionId={sessionId} initialMessages={initialMessages} />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full gap-(--md,16px)">
      <div className="min-w-0 flex h-full flex-1 flex-col">
        <ChatRuntime sessionId={sessionId} initialMessages={initialMessages} />
      </div>
      <div className="min-w-0 lg:flex hidden h-full w-[55%] border-l border-border">
        <ChatWorkflowSidePanel workflowId={workflowId} />
      </div>
    </div>
  );
}
