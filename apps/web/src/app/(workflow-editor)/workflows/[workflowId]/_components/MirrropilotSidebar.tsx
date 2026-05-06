"use client";

import { useState, useRef, useEffect } from "react";
import {
  BotMessageSquare,
  AtSign,
  ChevronDown,
  ArrowUp,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Globe,
  ChevronRight,
} from "lucide-react";
import { WorkflowChatMessage } from "@/lib/types";
import mirrropilotLogo from "@/assets/mirrropilot-icon.svg";
import Image from "next/image";

const MIRRROPILOT_LOGO = (
  <div className="flex items-center gap-[3.69px]" style={{ opacity: 0.2 }}>
    <Image
      src={mirrropilotLogo}
      alt="sidebar mirrropilot logo"
      height={31}
      width={42}
    />
    <span
      className="font-semibold text-[30px] tracking-[-0.95px] text-secondary-foreground"
      style={{ lineHeight: "30px" }}
    >
      Mirrropilot
    </span>
  </div>
);

function UserMessage({ message }: { message: WorkflowChatMessage }) {
  return (
    <div className="flex flex-col items-end gap-[var(--2xs,4px)]">
      <div
        className="px-5 py-[var(--xs,8px)] text-sm text-foreground max-w-[287px]"
        style={{
          background: "var(--unofficial-accent-2, #e5e5e5)",
          borderRadius: "24px 12px 6px 12px",
        }}
      >
        {message.content}
      </div>
      <button
        type="button"
        className="flex items-center justify-center size-8 rounded-full hover:bg-black/5 transition-colors"
      >
        <Copy className="size-4 text-muted-foreground" />
      </button>
    </div>
  );
}

function AgentMessage({ message }: { message: WorkflowChatMessage }) {
  const [thoughtOpen, setThoughtOpen] = useState(false);

  return (
    <div className="flex flex-col gap-[var(--2xs,4px)] w-full">
      <div className="flex items-center gap-[var(--3xs,2px)]">
        <div
          className="flex items-center justify-center size-9 rounded-full shrink-0"
          style={{ background: "var(--general-secondary, #f5f5f5)" }}
        >
          <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
            <path d="M10 2L18 13H2L10 2Z" fill="#171717" />
          </svg>
        </div>
        {message.thoughtDuration && (
          <button
            type="button"
            className="flex items-center gap-[6px] px-[var(--xs,8px)] py-[3px] rounded-[var(--rounded-lg,8px)] text-xs font-medium text-muted-foreground hover:bg-black/5 transition-colors"
            onClick={() => setThoughtOpen((v) => !v)}
          >
            Thought for {message.thoughtDuration}s
            {thoughtOpen ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-[var(--xs,8px)] w-full">
        <p className="text-sm text-foreground leading-5">{message.content}</p>
        <div className="flex items-center">
          <button
            type="button"
            className="flex items-center justify-center size-8 rounded-full hover:bg-black/5 transition-colors"
          >
            <Copy className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center size-8 rounded-full hover:bg-black/5 transition-colors"
          >
            <ThumbsUp className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center size-8 rounded-full hover:bg-black/5 transition-colors"
          >
            <ThumbsDown className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="flex items-center gap-[6px] px-[var(--xs,8px)] py-[3px] rounded-[var(--rounded-lg,8px)] text-xs font-medium hover:bg-black/5 transition-colors"
            style={{ color: "var(--unofficial-ghost-foreground, #404040)" }}
          >
            <Globe className="size-3" />
            Sources
            <ChevronDown className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface MirrropilotSidebarProps {
  messages: WorkflowChatMessage[];
  onSendMessage: (content: string) => void;
}

export default function MirrropilotSidebar({
  messages,
  onSendMessage,
}: MirrropilotSidebarProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput("");
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden rounded-[var(--radius,10px)] border shrink-0"
      style={{
        width: 364,
        background: "var(--unofficial-accent-0, #fafafa)",
        borderColor: "var(--unofficial-border-1, #f5f5f5)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-1 px-[var(--md,16px)] py-[var(--md,16px)] shrink-0">
        <BotMessageSquare className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Assistant
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-[var(--md,16px)]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            {MIRRROPILOT_LOGO}
          </div>
        ) : (
          <div className="flex flex-col gap-[var(--sm,12px)] py-[var(--sm,12px)]">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserMessage key={msg.id} message={msg} />
              ) : (
                <AgentMessage key={msg.id} message={msg} />
              ),
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-[var(--xs,8px)] px-[var(--md,16px)] pb-[var(--md,16px)] shrink-0">
        <div className="flex justify-end">
          <button
            type="button"
            className="flex items-center gap-[6px] px-[var(--xs,8px)] py-[3px] rounded-[var(--rounded-lg,8px)] text-xs font-medium border"
            style={{
              background: "rgba(255,255,255,0.1)",
              borderColor: "var(--unofficial-border-3, #d4d4d4)",
              color: "var(--general-foreground, #0a0a0a)",
            }}
          >
            <AtSign className="size-3" />
            Add context
          </button>
        </div>
        <div
          className="flex flex-col gap-[var(--xl,24px)] p-[var(--sm,12px)] rounded-[var(--radius,10px)] border"
          style={{
            background: "var(--general-accent, #f5f5f5)",
            borderColor: "var(--unofficial-border-3, #d4d4d4)",
          }}
        >
          <textarea
            className="w-full bg-transparent text-xs text-muted-foreground outline-none resize-none"
            style={{ minHeight: 20 }}
            placeholder="Write a message"
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-[6px] px-[var(--xs,8px)] py-[3px] rounded-[var(--rounded-lg,8px)] text-xs font-medium border"
              style={{
                background: "rgba(255,255,255,0.1)",
                borderColor: "var(--unofficial-border-3, #d4d4d4)",
                boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
                color: "var(--general-foreground, #0a0a0a)",
              }}
            >
              <span className="size-3 text-[10px]">✦</span>
              Gemini 3.0 pro
              <ChevronDown className="size-3" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center size-8 rounded-[var(--rounded-lg,8px)] transition-colors"
              style={{ background: "var(--general-primary, #171717)" }}
              onClick={handleSend}
            >
              <ArrowUp className="size-4 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
