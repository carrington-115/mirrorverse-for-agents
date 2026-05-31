"use client";

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import { Plus, ChevronDown, ArrowUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MODELS = [
  {
    id: "claude-opus-4-8",
    label: "Claude Opus 4.8",
    description: "Most powerful — complex reasoning",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    description: "Balanced speed and intelligence",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    description: "Fast and lightweight",
  },
] as const;

type ModelId = (typeof MODELS)[number]["id"];

interface HeroChatInputProps {
  className?: string;
}

export function HeroChatInput({ className }: HeroChatInputProps) {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState<ModelId>("claude-sonnet-4-6");
  const [modelOpen, setModelOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasContent = message.trim().length > 0;
  const currentModel = MODELS.find((m) => m.id === model) ?? MODELS[0];

  // Auto-resize textarea up to 200px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [message]);

  // Close model dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    }
    if (modelOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [modelOpen]);

  const handleSend = useCallback(() => {
    if (!hasContent) return;
    const params = new URLSearchParams({ q: message.trim(), model });
    window.location.href = `#?${params.toString()}`;
  }, [hasContent, message, model]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    /* Gradient border wrapper — 1px of the conic gradient is visible as the border */
    <div
      className={cn("relative w-full rounded-2xl p-px", className)}
      style={{
        background:
          "conic-gradient(from 90deg at 50% 50%, #18ca00 0%, #6ba308 20%, #bf7c11 36%, #6f7185 50%, #4482c2 62%, #36af56 78%, #18ca00 100%)",
      }}
    >
      {/* Inner card — fills everything except the 1px gradient border */}
      <div className="relative w-full rounded-[15px] bg-[#f5f5f5]">
        {/* Textarea */}
        <div className="px-4 pb-1 pt-4">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            rows={1}
            className="text-sm leading-relaxed max-h-[200px] min-h-[24px] w-full resize-none bg-transparent text-[#0a0a0a] outline-none placeholder:text-[#737373]"
          />
        </div>

        {/* Toolbar */}
        <div className="px-2 pb-2 pt-1 flex items-center justify-between">
          {/* Left: attach + model picker */}
          <div className="gap-0.5 flex items-center">
            <button
              type="button"
              className="size-9 hover:bg-black/5 flex items-center justify-center rounded-full text-[#737373] transition-colors hover:text-[#404040]"
              aria-label="Attach"
            >
              <Plus size={16} />
            </button>

            {/* Model selector */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setModelOpen((v) => !v)}
                className="gap-1.5 px-3 py-2 text-xs font-medium hover:bg-black/5 flex items-center rounded-full text-[#737373] transition-colors hover:text-[#404040]"
              >
                <ClaudeIcon />
                <span className="max-w-[120px] truncate">{currentModel.label}</span>
                <ChevronDown
                  size={12}
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    modelOpen && "rotate-180",
                  )}
                />
              </button>

              {modelOpen && (
                <div className="left-0 mb-1 w-60 bg-white py-1 shadow-lg absolute bottom-full z-50 overflow-hidden rounded-xl border border-[#e5e5e5]">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setModel(m.id);
                        setModelOpen(false);
                      }}
                      className="px-3 py-2.5 flex w-full items-center justify-between text-left transition-colors hover:bg-[#f5f5f5]"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0a0a0a]">{m.label}</p>
                        <p className="mt-0.5 text-xs text-[#737373]">{m.description}</p>
                      </div>
                      {model === m.id && (
                        <Check size={13} className="ml-2 shrink-0 text-[#171717]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: send */}
          <button
            type="button"
            onClick={handleSend}
            aria-label="Send message"
            className={cn(
              "size-8 text-white flex items-center justify-center rounded-full bg-[#171717] transition-opacity",
              !hasContent && "cursor-not-allowed opacity-30",
            )}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ClaudeIcon() {
  return (
    <span className="text-sm font-bold leading-none text-[#E8572A]" aria-hidden>
      ✳
    </span>
  );
}
