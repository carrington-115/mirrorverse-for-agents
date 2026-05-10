"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
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
import type { WorkflowChatMessage } from "@/lib/types";
import mirropilotLogo from "@/assets/mirropilot-icon.svg";

const MIRROPILOT_LOGO = (
  <div className="flex items-center gap-[3.69px]" style={{ opacity: 0.2 }}>
    <Image src={mirropilotLogo} alt="sidebar mirropilot logo" height={31} width={42} />
    <span
      className="font-semibold text-[30px] tracking-[-0.95px] text-secondary-foreground"
      style={{ lineHeight: "30px" }}
    >
      Mirropilot
    </span>
  </div>
);

function UserMessage({ message }: { message: WorkflowChatMessage }) {
  return (
    <div className="flex flex-col items-end gap-(--2xs,4px)">
      <div
        className="px-5 text-sm max-w-[287px] py-(--xs,8px) text-foreground"
        style={{
          background: "var(--unofficial-accent-2, #e5e5e5)",
          borderRadius: "24px 12px 6px 12px",
        }}
      >
        {message.content}
      </div>
      <button
        type="button"
        className="size-8 hover:bg-black/5 flex items-center justify-center rounded-full transition-colors"
      >
        <Copy className="size-4 text-muted-foreground" />
      </button>
    </div>
  );
}

function AgentMessage({ message }: { message: WorkflowChatMessage }) {
  const [thoughtOpen, setThoughtOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-(--2xs,4px)">
      <div className="flex items-center gap-(--3xs,2px)">
        <div
          className="size-9 flex shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--general-secondary, #f5f5f5)" }}
        >
          <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
            <path d="M10 2L18 13H2L10 2Z" fill="#171717" />
          </svg>
        </div>
        {message.thoughtDuration && (
          <button
            type="button"
            className="text-xs font-medium hover:bg-black/5 flex items-center gap-[6px] rounded-(--rounded-lg,8px) px-(--xs,8px) py-[3px] text-muted-foreground transition-colors"
            onClick={() => setThoughtOpen((v) => !v)}
          >
            Thought for {message.thoughtDuration}s
            {thoughtOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        )}
      </div>
      <div className="flex w-full flex-col gap-(--xs,8px)">
        <p className="text-sm leading-5 text-foreground">{message.content}</p>
        <div className="flex items-center">
          <button
            type="button"
            className="size-8 hover:bg-black/5 flex items-center justify-center rounded-full transition-colors"
          >
            <Copy className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="size-8 hover:bg-black/5 flex items-center justify-center rounded-full transition-colors"
          >
            <ThumbsUp className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="size-8 hover:bg-black/5 flex items-center justify-center rounded-full transition-colors"
          >
            <ThumbsDown className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="text-xs font-medium hover:bg-black/5 flex items-center gap-[6px] rounded-(--rounded-lg,8px) px-(--xs,8px) py-[3px] transition-colors"
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

interface MirropilotSidebarProps {
  messages: WorkflowChatMessage[];
  onSendMessage: (content: string) => void;
}

export function MirropilotSidebar({ messages, onSendMessage }: MirropilotSidebarProps) {
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
      className="flex h-full shrink-0 flex-col overflow-hidden rounded-(--radius,10px) border"
      style={{
        width: 364,
        background: "var(--unofficial-accent-0, #fafafa)",
        borderColor: "var(--unofficial-border-1, #f5f5f5)",
      }}
    >
      <div className="gap-1 flex shrink-0 items-center p-(--md,16px)">
        <BotMessageSquare className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto px-(--md,16px)">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">{MIRROPILOT_LOGO}</div>
        ) : (
          <div className="flex flex-col gap-(--sm,12px) py-(--sm,12px)">
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

      <div className="flex shrink-0 flex-col gap-(--xs,8px) px-(--md,16px) pb-(--md,16px)">
        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs font-medium flex items-center gap-[6px] rounded-(--rounded-lg,8px) border px-(--xs,8px) py-[3px]"
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
          className="flex flex-col gap-(--xl,24px) rounded-(--radius,10px) border p-(--sm,12px)"
          style={{
            background: "var(--general-accent, #f5f5f5)",
            borderColor: "var(--unofficial-border-3, #d4d4d4)",
          }}
        >
          <textarea
            className="text-xs w-full resize-none bg-transparent text-muted-foreground outline-none"
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
              className="text-xs font-medium flex items-center gap-[6px] rounded-(--rounded-lg,8px) border px-(--xs,8px) py-[3px]"
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
              className="size-8 flex items-center justify-center rounded-(--rounded-lg,8px) transition-colors"
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
