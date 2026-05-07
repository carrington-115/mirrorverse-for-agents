"use client";

import { useState, useRef, useCallback, useEffect, memo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MirrropilotLoader } from "./pilot-loader";
import {
  Copy,
  RefreshCw,
  Share,
  Globe,
  ChevronRight,
  Check,
  AlertCircle,
  Wrench,
  Loader2,
} from "lucide-react";

// ─────────────────────────────────────────
// TYPES — mirror the SSE event structure
// ─────────────────────────────────────────

export type MessageRole = "user" | "agent";

export type MessageStatus =
  | "pending" // submitted, waiting for first token
  | "thinking" // receiving thinking block
  | "streaming" // receiving text tokens
  | "tool_use" // model called a tool, awaiting result
  | "complete" // final state
  | "error"; // stream errored

export type BlockType = "thinking" | "text" | "tool_use";

export interface ThinkingBlock {
  type: "thinking";
  content: string;
  startedAt?: number;
  durationMs?: number;
}

export interface TextBlock {
  type: "text";
  content: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  toolName: string;
  toolId: string;
  input?: Record<string, unknown>;
  result?: string;
  status: "running" | "done" | "error";
}

export type ContentBlock = ThinkingBlock | TextBlock | ToolUseBlock;

export interface Source {
  title: string;
  url: string;
  domain: string;
}

export interface AgentMessageData {
  id: string;
  role: MessageRole;
  status: MessageStatus;
  blocks: ContentBlock[];
  sources?: Source[];
  createdAt: Date;
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Agent avatar
// ─────────────────────────────────────────

function AgentAvatar({ isAnimating }: { isAnimating: boolean }) {
  return (
    <div className="size-8 flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary">
      <MirrropilotLoader size={16} className={cn(!isAnimating && "opacity-60")} />
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Thinking block
// ─────────────────────────────────────────

function ThinkingBlockView({ block, isStreaming }: { block: ThinkingBlock; isStreaming: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const label = isStreaming
    ? "Thinking…"
    : block.durationMs
      ? `Thought for ${Math.round(block.durationMs / 1000)}s`
      : "Thought";

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="gap-1.5 text-xs flex items-center text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={isOpen}
      >
        {isStreaming ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <ChevronRight className={cn("size-3 transition-transform", isOpen && "rotate-90")} />
        )}
        <span>{label}</span>
      </button>

      {isOpen && block.content && (
        <div className="mt-2 px-3 py-2.5 text-xs leading-relaxed rounded-lg border border-border bg-secondary/50 whitespace-pre-wrap text-muted-foreground">
          {block.content}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Tool use card
// ─────────────────────────────────────────

const TOOL_COLORS: Record<string, string> = {
  salesforce_update: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  slack_notification: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  calendly_booking: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  stripe_payment_lookup: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

function ToolUseCard({ block }: { block: ToolUseBlock }) {
  const colorClass = TOOL_COLORS[block.toolName] ?? "bg-secondary text-secondary-foreground";
  const toolLabel = block.toolName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mb-3 gap-3 px-3 py-2.5 flex items-center rounded-xl border border-border bg-background">
      <div
        className={cn("size-7 flex shrink-0 items-center justify-center rounded-lg", colorClass)}
      >
        <Wrench className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate text-foreground">{toolLabel}</p>
        {block.result && <p className="text-xs truncate text-muted-foreground">{block.result}</p>}
        {!block.result && block.status === "running" && (
          <p className="text-xs text-muted-foreground">Running…</p>
        )}
      </div>
      <div className="shrink-0">
        {block.status === "running" && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        )}
        {block.status === "done" && <Check className="size-3.5 text-green-500" />}
        {block.status === "error" && <AlertCircle className="size-3.5 text-destructive" />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Text block (streaming-safe markdown)
// ─────────────────────────────────────────

const StreamingCursor = () => (
  <span
    className="ml-0.5 h-4 w-0.5 animate-pulse inline-block rounded-full bg-foreground align-text-bottom"
    aria-hidden
  />
);

const MarkdownComponents = {
  p: ({ children }: { children: ReactNode }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  code: ({ inline, children }: { inline?: boolean; children: ReactNode }) =>
    inline ? (
      <code className="px-1 py-0.5 text-xs rounded-sm bg-secondary font-mono">{children}</code>
    ) : (
      <code className="block">{children}</code>
    ),
  pre: ({ children }: { children: ReactNode }) => (
    <pre className="mb-3 p-3 text-xs leading-relaxed overflow-x-auto rounded-xl bg-secondary font-mono">
      {children}
    </pre>
  ),
  ul: ({ children }: { children: ReactNode }) => (
    <ul className="mb-3 pl-5 space-y-1 list-disc">{children}</ul>
  ),
  ol: ({ children }: { children: ReactNode }) => (
    <ol className="mb-3 pl-5 space-y-1 list-decimal">{children}</ol>
  ),
  strong: ({ children }: { children: ReactNode }) => (
    <strong className="font-medium text-foreground">{children}</strong>
  ),
  a: ({ href, children }: { href?: string; children: ReactNode }) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
};

function TextBlockView({ block, isStreaming }: { block: TextBlock; isStreaming: boolean }) {
  return (
    <div className="text-sm text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents as any}>
        {block.content}
      </ReactMarkdown>
      {isStreaming && <StreamingCursor />}
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Pending loader (before first token)
// ─────────────────────────────────────────

function PendingLoader() {
  return (
    <div className="gap-2 py-1 flex items-center">
      <MirrropilotLoader size={18} />
      <span className="text-xs text-muted-foreground">Mirrropilot is thinking…</span>
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Message action bar
// ─────────────────────────────────────────

function MessageActions({
  messageId,
  content,
  sources,
  onRetry,
}: {
  messageId: string;
  content: string;
  sources?: Source[];
  onRetry?: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleShare = useCallback(() => {
    // Wire to share sheet or copy link
    navigator.share?.({ text: content }).catch(() => {});
  }, [content]);

  return (
    <div className="mt-2.5 gap-0.5 flex items-center">
      {/* Copy */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
        aria-label="Copy message"
      >
        {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
      </Button>

      {/* Retry */}
      {onRetry && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => onRetry(messageId)}
          aria-label="Regenerate response"
        >
          <RefreshCw className="size-3.5" />
        </Button>
      )}

      {/* Share */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
        onClick={handleShare}
        aria-label="Share"
      >
        <Share className="size-3.5" />
      </Button>

      {/* Sources */}
      {sources && sources.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground"
          aria-label={`${sources.length} sources`}
        >
          <Globe className="size-3.5" />
          Sources
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: User message bubble
// ─────────────────────────────────────────

function UserMessage({ message }: { message: AgentMessageData }) {
  const textContent = message.blocks
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.content)
    .join("");

  return (
    <div className="px-1 flex justify-end">
      <div className="px-4 py-2.5 text-sm max-w-[75%] rounded-2xl rounded-tr-sm bg-secondary text-foreground">
        {textContent}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT: AgentMessage
// ─────────────────────────────────────────

export interface AgentMessageProps {
  message: AgentMessageData;
  onRetry?: (messageId: string) => void;
  className?: string;
}

export const AgentMessage = memo(function AgentMessage({
  message,
  onRetry,
  className,
}: AgentMessageProps) {
  const isStreaming = message.status === "streaming" || message.status === "thinking";
  const isPending = message.status === "pending";
  const isComplete = message.status === "complete";
  const isError = message.status === "error";

  if (message.role === "user") {
    return <UserMessage message={message} />;
  }

  const fullTextContent = message.blocks
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.content)
    .join("\n\n");

  const thinkingBlock = message.blocks.find((b): b is ThinkingBlock => b.type === "thinking");
  const textBlocks = message.blocks.filter((b): b is TextBlock => b.type === "text");
  const toolBlocks = message.blocks.filter((b): b is ToolUseBlock => b.type === "tool_use");

  return (
    <div className={cn("gap-3 px-1 flex items-start", className)}>
      {/* Avatar */}
      <AgentAvatar isAnimating={isStreaming || isPending} />

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Pending state */}
        {isPending && <PendingLoader />}

        {/* Thinking block */}
        {thinkingBlock && (
          <ThinkingBlockView block={thinkingBlock} isStreaming={message.status === "thinking"} />
        )}

        {/* Tool use cards */}
        {toolBlocks.map((block) => (
          <ToolUseCard key={block.toolId} block={block} />
        ))}

        {/* Text blocks */}
        {textBlocks.map((block, i) => (
          <TextBlockView
            key={i}
            block={block}
            isStreaming={isStreaming && i === textBlocks.length - 1}
          />
        ))}

        {/* Error state */}
        {isError && (
          <div className="gap-2 px-3 py-2.5 text-xs flex items-center rounded-xl border border-destructive/30 bg-destructive/5 text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>Something went wrong. Please try again.</span>
          </div>
        )}

        {/* Action bar — only on complete */}
        {isComplete && fullTextContent && (
          <MessageActions
            messageId={message.id}
            content={fullTextContent}
            sources={message.sources}
            onRetry={onRetry}
          />
        )}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────
// MAIN COMPONENT: ChatThread
// Renders the full list of messages
// ─────────────────────────────────────────

export interface ChatThreadProps {
  messages: AgentMessageData[];
  onRetry?: (messageId: string) => void;
  className?: string;
}

export function ChatThread({ messages, onRetry, className }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    const isActive =
      lastMsg.status === "pending" ||
      lastMsg.status === "streaming" ||
      lastMsg.status === "thinking" ||
      lastMsg.status === "tool_use";
    if (isActive) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className={cn("gap-6 px-4 py-6 flex flex-col overflow-y-auto", className)}
    >
      {messages.map((msg) => (
        <AgentMessage key={msg.id} message={msg} onRetry={onRetry} />
      ))}
      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
