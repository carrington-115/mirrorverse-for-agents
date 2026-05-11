"use client";

import {
  ActionBarPrimitive,
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { ArrowUp, Check, Copy, Pencil, RotateCcw, Square } from "lucide-react";
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
            EditComposer: EditComposerRow,
          }}
        />

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
        <ActionBarPrimitive.Edit asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Edit message"
          >
            <Pencil className="size-3.5" />
          </Button>
        </ActionBarPrimitive.Edit>
      </ActionBarPrimitive.Root>
    </MessagePrimitive.Root>
  );
}

function AssistantMessageRow() {
  return (
    <MessagePrimitive.Root className="gap-2 px-1 my-6 mx-auto flex w-full max-w-[780px] flex-col items-start">
      <div className="text-sm leading-relaxed max-w-full text-foreground">
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
    </MessagePrimitive.Root>
  );
}

function EditComposerRow() {
  return (
    <div className="gap-1.5 px-1 my-6 mx-auto flex w-full max-w-[780px] flex-col items-end">
      <ComposerPrimitive.Root className="gap-2 flex w-full max-w-[75%] flex-col">
        <ComposerPrimitive.Input
          autoFocus
          rows={1}
          className={cn(
            "w-full resize-none rounded-2xl rounded-tr-sm",
            "px-4 py-2.5 text-sm bg-secondary text-foreground",
            "ring-1 ring-border outline-none focus:ring-foreground/30",
            "leading-relaxed",
          )}
        />
        <div className="gap-2 flex justify-end">
          <ComposerPrimitive.Cancel asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-3 text-xs rounded-lg">
              Cancel
            </Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button type="submit" size="sm" className="h-7 px-3 text-xs rounded-lg">
              Send
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
}
