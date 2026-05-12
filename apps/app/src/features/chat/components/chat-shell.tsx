"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
  type ToolUIPart,
  type UIMessage,
  type UIMessagePart,
} from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Workflow as WorkflowIcon } from "lucide-react";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@mirrorverse/ui/ai-elements/attachments";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@mirrorverse/ui/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@mirrorverse/ui/ai-elements/message";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@mirrorverse/ui/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@mirrorverse/ui/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@mirrorverse/ui/ai-elements/reasoning";
import { Button } from "@/components/ui/button";

import mirropilotIcon from "@/assets/mirropilot-icon.svg";
import { useChatQuery } from "@/features/chat/api/queries";
import type { ChatMessageRow } from "@/features/chat/api/server-types";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { useTRPC } from "@/lib/trpc/client";
import { ChatSkeleton } from "./chat-skeleton";
import { Shimmer } from "@mirrorverse/ui/ai-elements/shimmer";

interface ChatShellProps {
  sessionId: string;
}

const MODELS = [
  { id: "claude-opus-4-7", name: "Claude opus 4.7", chef: "Anthropic", chefSlug: "anthropic" },
  {
    id: "claude-sonnet-4-6",
    name: "Claude sonnet 4.6",
    chef: "Anthropic",
    chefSlug: "anthropic",
  },
] as const;

const STARTERS = [
  {
    title: "Lead Qualification Agent",
    prompt:
      "Qualifies inbound leads from any channel, asks discovery questions, books meetings via Calendly, and updates Salesforce automatically.",
  },
  {
    title: "Expense Approval bots",
    prompt:
      "Processes employee expense requests, verifies receipts, checks policy limits, approves small amounts or escalates to finance.",
  },
  {
    title: "HR assistant",
    prompt:
      "Guides new hires through paperwork, benefits questions, and team intros while creating tasks in Asana and notifying HR.",
  },
] as const;

export function ChatShell({ sessionId }: ChatShellProps) {
  const { data, isLoading } = useChatQuery(sessionId);
  if (isLoading || !data) return <ChatSkeleton />;
  return <ChatRuntime sessionId={sessionId} initialMessages={data.messages.map(toUIMessage)} />;
}

function toUIMessage(row: ChatMessageRow): UIMessage {
  const raw = Array.isArray(row.contentBlocks) ? row.contentBlocks : [];
  const parts: UIMessagePart<never, never>[] = [];
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

function ChatRuntime({
  sessionId,
  initialMessages,
}: {
  sessionId: string;
  initialMessages: UIMessage[];
}) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [model, setModel] = useState<string>(MODELS[0].id);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async () => {
          const supabase = createSupabaseClient();
          const { data } = await supabase.auth.getSession();
          const headers: Record<string, string> = {};
          if (data.session) {
            headers.authorization = `Bearer ${data.session.access_token}`;
          }
          return headers;
        },
        body: { chatId: sessionId },
      }),
    [sessionId],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: sessionId,
    transport,
    messages: initialMessages,
    onFinish: () => {
      qc.invalidateQueries({ queryKey: trpc.chats.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
    },
  });

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text) return;
    sendMessage({ text }, { body: { model } });
  };

  const sendStarter = (prompt: string) => {
    sendMessage({ text: prompt }, { body: { model } });
  };

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
    return (
      <div className="px-4 flex h-full w-full items-center justify-center">
        <div className="max-w-3xl gap-6 flex w-full flex-col">
          <BrandHeader />
          {inputBlock}
          <StarterCards onPick={sendStarter} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="px-4 mx-auto w-full max-w-[780px]">
          {messages.map((message, index) => (
            <MessageRow
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
              isStreaming={isStreaming}
            />
          ))}
          {isSubmitted ? <ThinkingRow /> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-3">
        <div className="mx-auto w-full max-w-[780px]">{inputBlock}</div>
      </div>
    </div>
  );
}

function ChatPromptInput({
  onSubmit,
  status,
  onStop,
  model,
  onModelChange,
}: {
  onSubmit: (message: PromptInputMessage) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  onStop: () => void;
  model: string;
  onModelChange: (model: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected = MODELS.find((m) => m.id === model) ?? MODELS[0];

  const handleSelect = useCallback(
    (id: string) => {
      onModelChange(id);
      setPickerOpen(false);
    },
    [onModelChange],
  );

  return (
    <PromptInputProvider>
      <PromptInput globalDrop multiple onSubmit={onSubmit}>
        <PromptInputAttachmentsDisplay />
        <PromptInputBody>
          <PromptInputTextarea autoFocus placeholder="How can I help you today?" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
                <PromptInputActionAddScreenshot />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <ModelSelector onOpenChange={setPickerOpen} open={pickerOpen}>
              <ModelSelectorTrigger asChild>
                <PromptInputButton>
                  <ModelSelectorLogo provider={selected.chefSlug} />
                  <ModelSelectorName>{selected.name}</ModelSelectorName>
                </PromptInputButton>
              </ModelSelectorTrigger>
              <ModelSelectorContent>
                <ModelSelectorInput placeholder="Search models…" />
                <ModelSelectorList>
                  <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                  <ModelSelectorGroup heading="Anthropic">
                    {MODELS.map((m) => (
                      <ModelRow key={m.id} model={m} selectedId={model} onSelect={handleSelect} />
                    ))}
                  </ModelSelectorGroup>
                </ModelSelectorList>
              </ModelSelectorContent>
            </ModelSelector>
          </PromptInputTools>
          <PromptInputSubmit status={status} onStop={onStop} className="rounded-full" />
        </PromptInputFooter>
      </PromptInput>
    </PromptInputProvider>
  );
}

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();
  const handleRemove = useCallback((id: string) => attachments.remove(id), [attachments]);
  if (attachments.files.length === 0) return null;
  return (
    <Attachments variant="inline">
      {attachments.files.map((file) => (
        <AttachmentItem key={file.id} attachment={file} onRemove={handleRemove} />
      ))}
    </Attachments>
  );
};

type AttachmentFile = ReturnType<typeof usePromptInputAttachments>["files"][number];

const AttachmentItem = memo(
  ({ attachment, onRemove }: { attachment: AttachmentFile; onRemove: (id: string) => void }) => {
    const handleRemove = useCallback(() => onRemove(attachment.id), [onRemove, attachment.id]);
    return (
      <Attachment data={attachment} onRemove={handleRemove}>
        <AttachmentPreview />
        <AttachmentRemove />
      </Attachment>
    );
  },
);
AttachmentItem.displayName = "AttachmentItem";

const ModelRow = memo(
  ({
    model,
    selectedId,
    onSelect,
  }: {
    model: (typeof MODELS)[number];
    selectedId: string;
    onSelect: (id: string) => void;
  }) => {
    const handleSelect = useCallback(() => onSelect(model.id), [onSelect, model.id]);
    return (
      <ModelSelectorItem onSelect={handleSelect} value={model.id}>
        <ModelSelectorLogo provider={model.chefSlug} />
        <ModelSelectorName>{model.name}</ModelSelectorName>
        {selectedId === model.id ? (
          <CheckIcon className="size-4 ml-auto" />
        ) : (
          <div className="size-4 ml-auto" />
        )}
      </ModelSelectorItem>
    );
  },
);
ModelRow.displayName = "ModelRow";

function BrandHeader() {
  return (
    <div className="gap-y-6 mb-12 flex items-center justify-center">
      <Image src={mirropilotIcon} alt="Mirropilot" width={36} height={36} priority />
      <Shimmer as="h1" className="font-bold text-4xl ml-2">
        Mirropilot
      </Shimmer>
    </div>
  );
}

function StarterCards({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="gap-3 sm:grid-cols-3 grid grid-cols-1">
      {STARTERS.map((s) => (
        <button
          key={s.title}
          type="button"
          onClick={() => onPick(s.prompt)}
          className="p-4 rounded-xl border border-border bg-card text-left transition-colors hover:border-foreground/30 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <div className="text-sm font-semibold text-foreground">{s.title}</div>
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.prompt}</div>
        </button>
      ))}
    </div>
  );
}

function MessageRow({
  message,
  isLast,
  isStreaming,
}: {
  message: UIMessage;
  isLast: boolean;
  isStreaming: boolean;
}) {
  const reasoningParts = message.parts.filter(isReasoningUIPart);
  const reasoningText = reasoningParts.map((p) => p.text).join("\n\n");
  const hasReasoning = reasoningText.length > 0;
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLast && isStreaming && lastPart ? isReasoningUIPart(lastPart) : false;

  const body = (
    <Message from={message.role}>
      <MessageContent>
        {hasReasoning ? (
          <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{reasoningText}</ReasoningContent>
          </Reasoning>
        ) : null}
        {message.parts.map((part, i) => {
          if (isTextUIPart(part)) {
            return <MessageResponse key={`${message.id}-${i}`}>{part.text}</MessageResponse>;
          }
          if (isToolUIPart(part) && part.type === "tool-workflow_commit") {
            return <WorkflowCommitCard key={`${message.id}-${i}`} part={part} />;
          }
          return null;
        })}
      </MessageContent>
    </Message>
  );

  if (message.role === "user") return body;

  return (
    <div className="my-6 gap-3 flex w-full">
      <AssistantAvatar />
      <div className="min-w-0 flex-1">{body}</div>
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="my-6 gap-3 flex w-full">
      <AssistantAvatar />
      <div className="gap-2 text-sm flex items-center text-muted-foreground">
        <span>Mirropilot is thinking</span>
        <span className="gap-0.5 flex">
          <span
            className="size-1 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="size-1 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="size-1 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      </div>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="size-7 grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-background">
      <Image src={mirropilotIcon} alt="Mirropilot" width={16} height={16} />
    </div>
  );
}

interface WorkflowCommitInput {
  summary?: string;
  document?: {
    kind?: "automation" | "voice-agent" | "chat-agent" | "code";
    metadata?: { title?: string };
  };
}

interface WorkflowCommitResult {
  workflowId: string;
  workflowVersionId: string;
  versionNumber: number;
  title: string;
  kind: "automation" | "voice-agent" | "chat-agent" | "code";
}

const KIND_LABEL: Record<WorkflowCommitResult["kind"], string> = {
  automation: "Automation",
  "voice-agent": "Voice agent",
  "chat-agent": "Chat agent",
  code: "Code",
};

function WorkflowCommitCard({ part }: { part: ToolUIPart }) {
  const input = part.input as WorkflowCommitInput | undefined;
  const result =
    part.state === "output-available" ? (part.output as WorkflowCommitResult) : undefined;
  const title = result?.title ?? input?.document?.metadata?.title ?? "New workflow";
  const kind = result?.kind ?? input?.document?.kind;

  let statusLine: string;
  if (result) statusLine = "Workflow ready";
  else if (part.state === "output-error") statusLine = "Failed";
  else statusLine = "Building workflow…";

  return (
    <div className="my-3 gap-3 p-4 flex items-center rounded-2xl border border-border bg-card">
      <div className="size-9 grid shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <WorkflowIcon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">
          {statusLine}
          {kind ? ` · ${KIND_LABEL[kind]}` : null}
        </div>
      </div>
      {result ? (
        <Button asChild size="sm" className="h-8 shrink-0">
          <Link href={`/workflows/${result.workflowId}`}>Open</Link>
        </Button>
      ) : null}
    </div>
  );
}
