"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import type { PromptInputMessage } from "@mirrorverse/ui/ai-elements/prompt-input";

import { useTRPC } from "@/lib/trpc/client";
import { DEFAULT_CHAT_MODEL } from "@/features/chat/config";
import { buildChatTransport } from "@/features/chat/lib/transport";
import {
  useDeleteLastAssistantMutation,
  useEditAndTruncateMutation,
} from "@/features/chat/api/mutations";

import { AppConnectPanel } from "./app-connect-panel";
import { ChatConversation } from "./chat-conversation";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatPromptInput } from "./chat-prompt-input";
import { CredentialInterruptDialog } from "./credential-interrupt-dialog";

interface ChatRuntimeProps {
  sessionId: string;
  initialMessages: UIMessage[];
  onWorkflowSelect?: (workflowId: string) => void;
}

export function ChatRuntime({ sessionId, initialMessages, onWorkflowSelect }: ChatRuntimeProps) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [model, setModel] = useState<string>(DEFAULT_CHAT_MODEL);
  const [interruptDismissed, setInterruptDismissed] = useState(false);
  const [credentialsDismissed, setCredentialsDismissed] = useState(false);
  const [streamFinished, setStreamFinished] = useState(false);

  const transport = useMemo(() => buildChatTransport(sessionId), [sessionId]);

  const onFinish = useCallback(() => {
    qc.invalidateQueries({ queryKey: trpc.chats.list.queryKey() });
    qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
    setStreamFinished(true);
    setInterruptDismissed(false);
    setCredentialsDismissed(false);
  }, [qc, trpc.chats.list, trpc.workflows.list]);

  const { messages, sendMessage, regenerate, setMessages, status, stop } = useChat({
    id: sessionId,
    transport,
    messages: initialMessages,
    onFinish,
  });

  const { data: pendingInterrupt } = useQuery({
    ...trpc.chats.pendingInterrupt.queryOptions({ chatId: sessionId }),
    enabled: streamFinished && !interruptDismissed,
    refetchInterval: streamFinished && !interruptDismissed ? 2000 : false,
  });

  const editMutation = useEditAndTruncateMutation();
  const deleteLastAssistant = useDeleteLastAssistantMutation();

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const text = message.text.trim();
      if (!text) return;
      setStreamFinished(false);
      sendMessage({ text }, { body: { model } });
    },
    [sendMessage, model],
  );

  const handleStarter = useCallback(
    (prompt: string) => {
      setStreamFinished(false);
      sendMessage({ text: prompt }, { body: { model } });
    },
    [sendMessage, model],
  );

  const handleEditUserMessage = useCallback(
    async (messageId: string, newText: string) => {
      const trimmed = newText.trim();
      if (!trimmed) return;
      try {
        await editMutation.mutateAsync({
          messageId,
          blocks: [{ type: "text", text: trimmed }],
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save edit");
        return;
      }
      setMessages((current) => {
        const idx = current.findIndex((m) => m.id === messageId);
        if (idx === -1) return current;
        const edited: UIMessage = {
          ...current[idx],
          parts: [{ type: "text", text: trimmed }],
        };
        return [...current.slice(0, idx), edited];
      });
      regenerate({ body: { model, skipUserInsert: true } });
    },
    [editMutation, setMessages, regenerate, model],
  );

  const handleRetryAssistant = useCallback(async () => {
    try {
      await deleteLastAssistant.mutateAsync({ chatId: sessionId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete previous response");
      return;
    }
    setMessages((current) => {
      let cutoff = -1;
      for (let i = current.length - 1; i >= 0; i--) {
        if (current[i].role === "assistant") {
          cutoff = i;
          break;
        }
      }
      if (cutoff === -1) return current;
      return current.slice(0, cutoff);
    });
    regenerate({ body: { model, skipUserInsert: true } });
  }, [deleteLastAssistant, sessionId, setMessages, regenerate, model]);

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

  const interrupt = pendingInterrupt as Record<string, unknown> | null | undefined;

  const credentialInterrupt =
    interrupt?.kind === "needs_credential"
      ? (interrupt as {
          kind: string;
          appSlug: string;
          redirectUrl: string;
          connectionRequestId: string;
        })
      : null;

  const credentialsInterrupt =
    interrupt?.kind === "needs_credentials"
      ? (interrupt as { kind: string; id: string; appSlugs: string[] })
      : null;

  // Auto-resume: when the needs_credentials panel dismisses via polling (not manual cancel),
  // re-send the last user message so the agent continues automatically.
  const autoResumeRef = useRef(false);
  useEffect(() => {
    if (credentialsInterrupt) {
      autoResumeRef.current = true;
    }
  }, [credentialsInterrupt]);
  useEffect(() => {
    if (autoResumeRef.current && !credentialsInterrupt && !credentialsDismissed && streamFinished) {
      autoResumeRef.current = false;
      setStreamFinished(false);
      regenerate({ body: { model, skipUserInsert: true } });
    }
  }, [credentialsInterrupt, credentialsDismissed, streamFinished, regenerate, model]);

  // Reset dismissed flags when a new interrupt arrives (different id).
  const prevInterruptId = useRef<string | null>(null);
  useEffect(() => {
    const id = credentialInterrupt?.connectionRequestId ?? credentialsInterrupt?.id ?? null;
    if (id && id !== prevInterruptId.current) {
      prevInterruptId.current = id;
      setInterruptDismissed(false);
      setCredentialsDismissed(false);
    }
  }, [credentialInterrupt, credentialsInterrupt]);

  if (isEmpty) {
    return (
      <>
        <ChatEmptyState onPickStarter={handleStarter} inputSlot={inputBlock} />
        {credentialInterrupt && !interruptDismissed && (
          <CredentialInterruptDialog
            appSlug={credentialInterrupt.appSlug}
            redirectUrl={credentialInterrupt.redirectUrl}
            onDismiss={() => setInterruptDismissed(true)}
          />
        )}
        {credentialsInterrupt && !credentialsDismissed && (
          <AppConnectPanel
            appSlugs={credentialsInterrupt.appSlugs}
            chatId={sessionId}
            onDismiss={() => setCredentialsDismissed(true)}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChatConversation
        messages={messages}
        isStreaming={isStreaming}
        showThinking={isSubmitted}
        onEditUserMessage={handleEditUserMessage}
        onRetryAssistant={handleRetryAssistant}
        onWorkflowSelect={onWorkflowSelect}
      />
      {credentialsInterrupt && !credentialsDismissed && (
        <AppConnectPanel
          appSlugs={credentialsInterrupt.appSlugs}
          chatId={sessionId}
          onDismiss={() => setCredentialsDismissed(true)}
        />
      )}
      <div className="p-3">
        <div className="mx-auto w-full max-w-[780px]">{inputBlock}</div>
      </div>
      {credentialInterrupt && !interruptDismissed && (
        <CredentialInterruptDialog
          appSlug={credentialInterrupt.appSlug}
          redirectUrl={credentialInterrupt.redirectUrl}
          onDismiss={() => setInterruptDismissed(true)}
        />
      )}
    </div>
  );
}
