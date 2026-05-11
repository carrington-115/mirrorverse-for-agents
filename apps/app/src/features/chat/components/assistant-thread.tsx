"use client";

import Image from "next/image";
import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  type ReasoningMessagePartProps,
} from "@assistant-ui/react";
import { ArrowUp, Check, Copy, RotateCcw, Square } from "lucide-react";
import mirropilotIcon from "@/assets/mirropilot-icon.svg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AssistantThread() {
  return (
    <ThreadPrimitive.Root className="flex h-full w-full flex-col">
      <ThreadPrimitive.Viewport className="px-4 flex-1 overflow-y-auto">
        <ThreadPrimitive.Empty>
          <EmptyState />
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessageRow,
            AssistantMessage: AssistantMessageRow,
          }}
        />

        <ThinkingIndicator />

        <div className="h-4" aria-hidden />
      </ThreadPrimitive.Viewport>

      <div className="p-3 border-t border-border">
        <Composer />
      </div>
    </ThreadPrimitive.Root>
  );
}

function EmptyState() {
  return (
    <div className="py-16 flex h-full w-full items-center justify-center">
      <p className="text-sm text-muted-foreground">Ask Mirropilot anything to get started.</p>
    </div>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="gap-2 mx-auto flex w-full max-w-[780px] items-end">
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder="Ask Mirropilot…"
        className={cn(
          "max-h-[200px] min-h-[44px] flex-1 resize-none rounded-2xl border border-border",
          "px-4 py-2.5 text-sm bg-background text-foreground outline-none",
          "focus:ring-1 focus:ring-foreground/30",
          "leading-relaxed",
        )}
      />
      <AuiIf condition={({ thread }) => thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-10 shrink-0 rounded-full"
          >
            <Square className="size-4" />
          </Button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
      <AuiIf condition={({ thread }) => !thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <Button type="submit" size="icon" className="size-10 shrink-0 rounded-full">
            <ArrowUp className="size-4" />
          </Button>
        </ComposerPrimitive.Send>
      </AuiIf>
    </ComposerPrimitive.Root>
  );
}

function MessagePartText({ text }: { text: string }) {
  return <span className="whitespace-pre-wrap">{text}</span>;
}

function UserMessageRow() {
  return (
    <MessagePrimitive.Root className="gap-1.5 px-1 my-6 mx-auto flex w-full max-w-[780px] flex-col items-end">
      <div className="px-4 py-2.5 text-sm leading-relaxed max-w-[75%] rounded-2xl rounded-tr-sm bg-secondary text-foreground">
        <MessagePrimitive.Content
          components={{ Text: ({ text }) => <MessagePartText text={text} /> }}
        />
      </div>

      <ActionBarPrimitive.Root
        hideWhenRunning
        autohide="not-last"
        className="gap-0.5 flex items-center"
      >
        <ActionBarPrimitive.Copy asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Copy message"
          >
            <MessagePrimitive.If copied>
              <Check className="size-3.5 text-green-500" />
            </MessagePrimitive.If>
            <MessagePrimitive.If copied={false}>
              <Copy className="size-3.5" />
            </MessagePrimitive.If>
          </Button>
        </ActionBarPrimitive.Copy>
      </ActionBarPrimitive.Root>
    </MessagePrimitive.Root>
  );
}

function AssistantAvatar() {
  return (
    <div className="size-7 grid shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-background">
      <Image src={mirropilotIcon} alt="Mirropilot" width={16} height={16} />
    </div>
  );
}

function ReasoningPart({ text }: ReasoningMessagePartProps) {
  if (!text) return null;
  return (
    <details className="my-1 px-3 py-2 text-xs rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground">
      <summary className="font-medium cursor-pointer select-none">Thoughts</summary>
      <div className="mt-1.5 leading-relaxed whitespace-pre-wrap">{text}</div>
    </details>
  );
}

function ThinkingIndicator() {
  return (
    <AuiIf condition={({ thread }) => thread.isRunning}>
      <AuiIf
        condition={({ thread }) => {
          const last = thread.messages[thread.messages.length - 1];
          if (!last || last.role !== "assistant") return true;
          const hasContent = last.content.some(
            (p) =>
              (p.type === "text" && p.text.length > 0) ||
              (p.type === "reasoning" && p.text.length > 0) ||
              p.type === "tool-call",
          );
          return !hasContent;
        }}
      >
        <div className="gap-2 px-1 my-6 mx-auto flex w-full max-w-[780px] items-center">
          <AssistantAvatar />
          <div className="gap-1 text-sm flex items-center text-muted-foreground">
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
      </AuiIf>
    </AuiIf>
  );
}

function AssistantMessageRow() {
  return (
    <MessagePrimitive.Root className="gap-3 px-1 my-6 mx-auto flex w-full max-w-[780px] items-start">
      <AssistantAvatar />
      <div className="gap-2 min-w-0 flex flex-1 flex-col items-start">
        <div className="text-sm leading-relaxed max-w-full text-foreground">
          <MessagePrimitive.Content
            components={{
              Text: ({ text }) => <MessagePartText text={text} />,
              Reasoning: ReasoningPart,
            }}
          />
        </div>

        <ActionBarPrimitive.Root
          hideWhenRunning
          autohide="not-last"
          className="gap-0.5 flex items-center"
        >
          <ActionBarPrimitive.Copy asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Copy message"
            >
              <MessagePrimitive.If copied>
                <Check className="size-3.5 text-green-500" />
              </MessagePrimitive.If>
              <MessagePrimitive.If copied={false}>
                <Copy className="size-3.5" />
              </MessagePrimitive.If>
            </Button>
          </ActionBarPrimitive.Copy>
          <ActionBarPrimitive.Reload asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Regenerate"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </ActionBarPrimitive.Reload>
        </ActionBarPrimitive.Root>
      </div>
    </MessagePrimitive.Root>
  );
}
