"use client";

import { useMemo } from "react";
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
import { Sparkles, Workflow as WorkflowIcon } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@mirrorverse/ui/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@mirrorverse/ui/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
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

interface ChatShellProps {
  sessionId: string;
}

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
    sendMessage({ text });
  };

  const isStreaming = status === "streaming";
  const isSubmitted = status === "submitted";

  return (
    <div className="flex h-full w-full flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="px-4 mx-auto w-full max-w-[780px]">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<Sparkles className="size-8 text-muted-foreground" />}
              title="Mirropilot"
              description="Describe a workflow to get started."
            />
          ) : (
            messages.map((message, index) => (
              <MessageRow
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
                isStreaming={isStreaming}
              />
            ))
          )}
          {isSubmitted ? <ThinkingRow /> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-3 border-t border-border">
        <PromptInput onSubmit={handleSubmit} className="mx-auto w-full max-w-[780px]">
          <PromptInputTextarea autoFocus placeholder="Ask Mirropilot…" />
          <PromptInputSubmit className="bottom-2 right-2 absolute" status={status} onStop={stop} />
        </PromptInput>
      </div>
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
