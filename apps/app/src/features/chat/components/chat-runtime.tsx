"use client";

import { useCallback, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import type { PromptInputMessage } from "@mirrorverse/ui/ai-elements/prompt-input";

import { useTRPC } from "@/lib/trpc/client";
import { DEFAULT_CHAT_MODEL } from "@/features/chat/config";
import { buildChatTransport } from "@/features/chat/lib/transport";

import { ChatConversation } from "./chat-conversation";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatPromptInput } from "./chat-prompt-input";

interface ChatRuntimeProps {
  sessionId: string;
  initialMessages: UIMessage[];
}

export function ChatRuntime({ sessionId, initialMessages }: ChatRuntimeProps) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [model, setModel] = useState<string>(DEFAULT_CHAT_MODEL);

  const transport = useMemo(() => buildChatTransport(sessionId), [sessionId]);

  const onFinish = useCallback(() => {
    qc.invalidateQueries({ queryKey: trpc.chats.list.queryKey() });
    qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
  }, [qc, trpc.chats.list, trpc.workflows.list]);

  const { messages, sendMessage, status, stop } = useChat({
    id: sessionId,
    transport,
    messages: initialMessages,
    onFinish,
  });

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const text = message.text.trim();
      if (!text) return;
      sendMessage({ text }, { body: { model } });
    },
    [sendMessage, model],
  );

  const handleStarter = useCallback(
    (prompt: string) => {
      sendMessage({ text: prompt }, { body: { model } });
    },
    [sendMessage, model],
  );

  const isEmpty = messages.length === 0;
  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";

  const inputBlock = (
    <ChatPromptInput
      onSubmit={handleSubmit}
      status={status}
      onStop={stop}
      model={model}
      onModelChange={setModel}
    />
  );

  if (isEmpty) {
    return <ChatEmptyState onPickStarter={handleStarter} inputSlot={inputBlock} />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChatConversation messages={messages} isStreaming={isStreaming} showThinking={isSubmitted} />
      <div className="p-3">
        <div className="mx-auto w-full max-w-[780px]">{inputBlock}</div>
      </div>
    </div>
  );
}
