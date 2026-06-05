"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isToolUIPart, type UIMessage } from "ai";
import { toast } from "sonner";
import type { PromptInputMessage } from "@mirrorverse/ui/ai-elements/prompt-input";

import { useTRPC } from "@/lib/trpc/client";
import { DEFAULT_CHAT_MODEL } from "@/features/chat/config";
import { buildChatTransport } from "@/features/chat/lib/transport";
import {
  useDeleteLastAssistantMutation,
  useEditAndTruncateMutation,
} from "@/features/chat/api/mutations";

import { useMirrorpilotFileUpload } from "@/features/knowledge/hooks/use-mirrorpilot-file-upload";
import { ComposioIntegrationsDialog } from "@/features/integrations/components/integration";
import { AddWebhookSheet } from "@/features/webhooks/components/add-webhook-sheet";
import {
  isSubmitPlanPart,
  readSubmitPlanOutput,
  type SubmitPlanToolPart,
  type WorkflowPlan,
} from "@/features/chat/lib/submit-plan-tool";
import {
  isWorkflowCommitPart,
  readWorkflowCommitResult,
} from "@/features/chat/lib/workflow-commit-tool";

import { ChatConversation } from "./chat-conversation";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatPromptInput } from "./chat-prompt-input";
import { CredentialInterruptDialog } from "./credential-interrupt-dialog";
import type { PlanProgressStep } from "./plan-progress-bar";
import type { SessionTriggerInfo } from "./trigger-picker";

interface ChatRuntimeProps {
  sessionId: string;
  initialMessages: UIMessage[];
  onWorkflowSelect?: (workflowId: string) => void;
  onFirstMessage?: () => void;
  onStreamFinish?: () => void;
}

export function ChatRuntime({
  sessionId,
  initialMessages,
  onWorkflowSelect,
  onFirstMessage,
  onStreamFinish,
}: ChatRuntimeProps) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [model, setModel] = useState<string>(DEFAULT_CHAT_MODEL);
  const [interruptDismissed, setInterruptDismissed] = useState(false);
  const [streamFinished, setStreamFinished] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);

  const transport = useMemo(() => buildChatTransport(sessionId), [sessionId]);
  const { upload: uploadFiles, isUploading } = useMirrorpilotFileUpload(sessionId);

  // Documents the user picked in a knowledge-base card to scope RAG to. Held in
  // a ref so every subsequent request carries it without re-creating handlers.
  const ragDocumentIdsRef = useRef<string[]>([]);

  const onFinish = useCallback(() => {
    qc.invalidateQueries({ queryKey: trpc.chats.list.queryKey() });
    qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
    setStreamFinished(true);
    setInterruptDismissed(false);
    onStreamFinish?.();
  }, [qc, trpc.chats.list, trpc.workflows.list, onStreamFinish]);

  const { messages, sendMessage, regenerate, setMessages, status, stop } = useChat({
    id: sessionId,
    transport,
    messages: initialMessages,
    onFinish,
  });

  const { planSteps, sessionTriggers } = useMemo(() => {
    let foundPlan: WorkflowPlan | null = null;
    let planMsgIndex = -1;
    let hasCommit = false;
    const triggerMap = new Map<string, SessionTriggerInfo>();

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role !== "assistant") continue;
      for (const part of msg.parts) {
        if (!isToolUIPart(part)) continue;
        if (isSubmitPlanPart(part)) {
          const plan = readSubmitPlanOutput(part as SubmitPlanToolPart);
          if (plan && plan.steps.length > 3) {
            foundPlan = plan;
            planMsgIndex = i;
          }
        }
        if (isWorkflowCommitPart(part)) {
          const result = readWorkflowCommitResult(part);
          if (result) {
            hasCommit = true;
            const rawNodes = (result.document as { nodes?: unknown[] } | null)?.nodes;
            const nodes = Array.isArray(rawNodes) ? rawNodes : [];
            for (const node of nodes) {
              if (typeof node !== "object" || !node) continue;
              const n = node as Record<string, unknown>;
              const type = typeof n.type === "string" ? n.type : "";
              if (type.startsWith("trigger.")) {
                triggerMap.set(type, { type, workflowTitle: result.title });
              }
            }
          }
        }
      }
    }

    const sessionTriggers: SessionTriggerInfo[] = Array.from(triggerMap.values());

    if (hasCommit || !foundPlan || planMsgIndex < 0) {
      return { planSteps: [] as PlanProgressStep[], sessionTriggers };
    }

    const userMsgsAfter = messages.slice(planMsgIndex + 1).filter((m) => m.role === "user").length;

    const planSteps: PlanProgressStep[] = foundPlan.steps.map((s, idx) => ({
      step: s.step,
      title: s.description,
      completed: idx < userMsgsAfter,
    }));

    return { planSteps, sessionTriggers };
  }, [messages]);

  const { data: pendingInterrupt } = useQuery({
    ...trpc.chats.pendingInterrupt.queryOptions({ chatId: sessionId }),
    enabled: streamFinished && !interruptDismissed,
    refetchInterval: streamFinished && !interruptDismissed ? 2000 : false,
  });

  const editMutation = useEditAndTruncateMutation();
  const deleteLastAssistant = useDeleteLastAssistantMutation();

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();
      const files = message.files ?? [];
      if (!text && files.length === 0) return;

      if (messages.length === 0) onFirstMessage?.();
      setStreamFinished(false);

      const imageFiles = files.filter((f) => f.mediaType.startsWith("image/"));

      let fullText = text;

      if (files.length > 0) {
        const uploaded = await uploadFiles(files);
        if (uploaded.length > 0) {
          const names = uploaded.map((f) => f.filename).join(", ");
          const suffix = `\n\n[Added to knowledge base: ${names}]`;
          fullText = text
            ? text + suffix
            : `I uploaded ${uploaded.length} file(s) to the knowledge base: ${names}`;
        } else if (!text) {
          // Uploads failed but the user still attached something — send anyway.
          fullText = "I attached some files.";
        }
      }

      // Images are also forwarded to the model as vision input so the agent can
      // see them in the conversation. Documents are surfaced later via RAG.
      const body = { model, ragDocumentIds: ragDocumentIdsRef.current };
      sendMessage(
        imageFiles.length > 0 ? { text: fullText, files: imageFiles } : { text: fullText },
        { body },
      );
    },
    [sendMessage, model, uploadFiles, messages.length, onFirstMessage],
  );

  const fillInputRef = useRef<((text: string) => void) | null>(null);

  const handleFillInput = useCallback((prompt: string) => {
    fillInputRef.current?.(prompt);
    setTimeout(() => {
      document
        .querySelector<HTMLTextAreaElement>('textarea[data-slot="input-group-control"]')
        ?.focus();
    }, 0);
  }, []);

  const handlePhoneSelect = useCallback(
    (phoneNumber: string) => {
      setStreamFinished(false);
      sendMessage(
        { text: `Provision ${phoneNumber}` },
        { body: { model, ragDocumentIds: ragDocumentIdsRef.current } },
      );
    },
    [sendMessage, model],
  );

  const handlePhoneNumberForVoiceAgent = useCallback(
    (phoneNumberId: string) => {
      setStreamFinished(false);
      sendMessage(
        { text: `Use phone number ${phoneNumberId} for this voice agent` },
        { body: { model, ragDocumentIds: ragDocumentIdsRef.current } },
      );
    },
    [sendMessage, model],
  );

  const handleGetManagedNumber = useCallback(() => {
    setStreamFinished(false);
    sendMessage(
      { text: "I don't have a phone number yet. Help me get a Mirrorverse-managed phone number." },
      { body: { model, ragDocumentIds: ragDocumentIdsRef.current } },
    );
  }, [sendMessage, model]);

  const handleByoTwilio = useCallback(() => {
    setStreamFinished(false);
    sendMessage(
      { text: "I want to use my own Twilio phone number instead." },
      { body: { model, ragDocumentIds: ragDocumentIdsRef.current } },
    );
  }, [sendMessage, model]);

  const handleConfirmDocuments = useCallback(
    (documentIds: string[], labels: string[]) => {
      ragDocumentIdsRef.current = documentIds;
      setStreamFinished(false);
      const text =
        labels.length > 0
          ? `Use only these documents to answer my questions from now on: ${labels.join(", ")}.`
          : "Use all of my documents to answer my questions.";
      sendMessage({ text }, { body: { model, ragDocumentIds: documentIds } });
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
      regenerate({
        body: { model, skipUserInsert: true, ragDocumentIds: ragDocumentIdsRef.current },
      });
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
    regenerate({
      body: { model, skipUserInsert: true, ragDocumentIds: ragDocumentIdsRef.current },
    });
  }, [deleteLastAssistant, sessionId, setMessages, regenerate, model]);

  const isEmpty = messages.length === 0;
  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";

  const lastMessage = messages[messages.length - 1];
  const lastMessageHasContent = lastMessage?.role === "assistant" && lastMessage.parts.length > 0;

  const inputBlock = (
    <ChatPromptInput
      compact={!isEmpty}
      onSubmit={handleSubmit}
      status={isUploading ? "submitted" : status}
      onStop={stop}
      model={model}
      onModelChange={setModel}
      onConnectApp={() => setBrowseOpen(true)}
      onConnectWebhook={() => setWebhookOpen(true)}
      planSteps={planSteps}
      sessionTriggers={sessionTriggers}
      fillInputRef={fillInputRef}
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

  // Auto-resume: when either interrupt panel dismisses via polling (not manual cancel),
  // re-send the last user message so the agent continues automatically.
  const autoResumeRef = useRef(false);
  useEffect(() => {
    if (credentialsInterrupt || credentialInterrupt) {
      autoResumeRef.current = true;
    }
  }, [credentialsInterrupt, credentialInterrupt]);
  useEffect(() => {
    if (
      autoResumeRef.current &&
      !credentialsInterrupt &&
      !credentialInterrupt &&
      !interruptDismissed &&
      streamFinished
    ) {
      autoResumeRef.current = false;
      setStreamFinished(false);
      regenerate({
        body: { model, skipUserInsert: true, ragDocumentIds: ragDocumentIdsRef.current },
      });
    }
  }, [
    credentialsInterrupt,
    credentialInterrupt,
    interruptDismissed,
    streamFinished,
    regenerate,
    model,
  ]);

  // Reset dismissed flags when a new interrupt arrives (different id).
  const prevInterruptId = useRef<string | null>(null);
  useEffect(() => {
    const id = credentialInterrupt?.connectionRequestId ?? credentialsInterrupt?.id ?? null;
    if (id && id !== prevInterruptId.current) {
      prevInterruptId.current = id;
      setInterruptDismissed(false);
    }
  }, [credentialInterrupt, credentialsInterrupt]);

  const inlineInterrupt = credentialsInterrupt ?? null;

  if (isEmpty) {
    return (
      <>
        <ChatEmptyState onFillInput={handleFillInput} inputSlot={inputBlock} />
        {credentialInterrupt && !interruptDismissed && (
          <CredentialInterruptDialog
            appSlug={credentialInterrupt.appSlug}
            redirectUrl={credentialInterrupt.redirectUrl}
            onDismiss={() => setInterruptDismissed(true)}
          />
        )}
        <ComposioIntegrationsDialog open={browseOpen} onOpenChange={setBrowseOpen} />
        <AddWebhookSheet open={webhookOpen} onOpenChange={setWebhookOpen} />
      </>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChatConversation
        messages={messages}
        isStreaming={isStreaming}
        showThinking={isSubmitted || (isStreaming && !lastMessageHasContent)}
        interrupt={inlineInterrupt}
        chatId={sessionId}
        onEditUserMessage={handleEditUserMessage}
        onRetryAssistant={handleRetryAssistant}
        onWorkflowSelect={onWorkflowSelect}
        onPhoneSelect={handlePhoneSelect}
        onPhoneNumberForVoiceAgent={handlePhoneNumberForVoiceAgent}
        onGetManagedNumber={handleGetManagedNumber}
        onByoTwilio={handleByoTwilio}
        onConfirmDocuments={handleConfirmDocuments}
      />
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
      <ComposioIntegrationsDialog open={browseOpen} onOpenChange={setBrowseOpen} />
      <AddWebhookSheet open={webhookOpen} onOpenChange={setWebhookOpen} />
    </div>
  );
}
