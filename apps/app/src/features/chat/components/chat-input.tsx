"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  Plus,
  ChevronDown,
  ArrowUp,
  Mic,
  MicOff,
  X,
  Paperclip,
  ImageIcon,
  Globe,
  Zap,
  Hash,
  Square,
  Check,
  Grid2x2,
  Link2,
  Phone,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const CLAUDE_MODELS = [
  {
    id: "claude-opus-4-7",
    label: "Claude Opus 4.7",
    description: "Most powerful model — excels at complex reasoning and nuanced tasks",
  },
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    description: "Balanced speed and intelligence for everyday workflows",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    description: "Fast and lightweight — ideal for simple, high-volume tasks",
  },
  {
    id: "claude-sonnet-3-7",
    label: "Claude Sonnet 3.7",
    description: "Previous-gen Sonnet — reliable and cost-efficient",
  },
] as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[number]["id"];

export interface ContextChip {
  id: string;
  type: "file" | "image" | "agent" | "tool" | "url";
  label: string;
  mimeType?: string;
  file?: File;
}

export interface ChatInputProps {
  onSend?: (payload: ChatPayload) => void;
  onStop?: () => void;
  placeholder?: string;
  className?: string;
  isStreaming?: boolean;
}

export interface ChatPayload {
  message: string;
  model: ClaudeModel;
  context: ContextChip[];
}

const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE_MB = 25;
const MAX_CONTEXT_CHIPS = 8;

function ClaudeIcon({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold leading-none text-[#E8572A]", className)} aria-hidden>
      ✳
    </span>
  );
}

const CHIP_ICONS: Record<ContextChip["type"], React.ElementType> = {
  file: Paperclip,
  image: ImageIcon,
  agent: Zap,
  tool: Hash,
  url: Globe,
};

function ContextChipItem({
  chip,
  onRemove,
}: {
  chip: ContextChip;
  onRemove: (id: string) => void;
}) {
  const Icon = CHIP_ICONS[chip.type];
  return (
    <div className="gap-1.5 px-2.5 py-1 text-xs flex items-center rounded-full border border-border bg-secondary text-muted-foreground">
      <Icon className="size-3 shrink-0" />
      <span className="max-w-[120px] truncate">{chip.label}</span>
      <button
        type="button"
        onClick={() => onRemove(chip.id)}
        className="ml-0.5 p-0.5 rounded-full opacity-50 transition-opacity hover:opacity-100"
        aria-label={`Remove ${chip.label}`}
      >
        <X className="size-2.5" />
      </button>
    </div>
  );
}

const MENTIONABLE_AGENTS = [
  { id: "inventory-agent", label: "Inventory inquiry agent", type: "agent" as const },
  { id: "sales-agent", label: "Sales agent", type: "agent" as const },
  { id: "support-agent", label: "Support agent", type: "agent" as const },
  { id: "billing-agent", label: "Billing agent", type: "agent" as const },
];

const MENTIONABLE_TOOLS = [
  { id: "salesforce", label: "Salesforce", type: "tool" as const },
  { id: "slack", label: "Slack", type: "tool" as const },
  { id: "hubspot", label: "HubSpot", type: "tool" as const },
  { id: "calendly", label: "Calendly", type: "tool" as const },
];

interface MentionPopupProps {
  query: string;
  triggerChar: "@" | "#";
  onSelect: (item: { id: string; label: string; type: ContextChip["type"] }) => void;
  onDismiss: () => void;
}

function MentionPopup({ query, triggerChar, onSelect, onDismiss }: MentionPopupProps) {
  const items = triggerChar === "@" ? MENTIONABLE_AGENTS : MENTIONABLE_TOOLS;
  const filtered = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  if (!filtered.length) return null;

  return (
    <div className="left-0 mb-1 w-56 shadow-lg absolute bottom-full z-50 overflow-hidden rounded-xl border border-border bg-background">
      <div className="px-3 py-1.5 font-medium tracking-wide border-b border-border text-[10px] text-muted-foreground uppercase">
        {triggerChar === "@" ? "Agents" : "Tools"}
      </div>
      {filtered.map((item) => {
        const Icon = CHIP_ICONS[item.type];
        return (
          <button
            key={item.id}
            type="button"
            className="gap-2.5 px-3 py-2 text-sm flex w-full items-center text-left text-foreground transition-colors hover:bg-secondary"
            onClick={() => onSelect(item)}
          >
            <Icon className="size-3.5 shrink-0 text-muted-foreground" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function ChatInput({
  onSend,
  onStop,
  placeholder = "How can I help you today?",
  className,
  isStreaming = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState<ClaudeModel>("claude-opus-4-7");
  const [contextChips, setContextChips] = useState<ContextChip[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mentionState, setMentionState] = useState<{
    active: boolean;
    trigger: "@" | "#";
    query: string;
    startIndex: number;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasContent = message.trim().length > 0 || contextChips.length > 0;

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [message, resizeTextarea]);

  const addContextChip = useCallback((chip: Omit<ContextChip, "id"> & { id?: string }) => {
    setContextChips((prev) => {
      if (prev.length >= MAX_CONTEXT_CHIPS) return prev;
      if (prev.find((c) => c.label === chip.label)) return prev;
      return [...prev, { ...chip, id: chip.id ?? crypto.randomUUID() }];
    });
  }, []);

  const removeContextChip = useCallback((id: string) => {
    setContextChips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleSend = useCallback(() => {
    if (isStreaming) {
      onStop?.();
      return;
    }
    if (!hasContent) return;
    onSend?.({ message: message.trim(), model, context: contextChips });
    setMessage("");
    setContextChips([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [isStreaming, hasContent, message, model, contextChips, onSend, onStop]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !mentionState?.active) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape" && mentionState?.active) {
        setMentionState(null);
      }
    },
    [handleSend, mentionState],
  );

  const handleTextChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);

    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);

    const match = textBeforeCursor.match(/(?:^|\s)([@#])(\w*)$/);
    if (match) {
      const trigger = match[1] as "@" | "#";
      const query = match[2];
      const startIndex = textBeforeCursor.lastIndexOf(match[1]);
      setMentionState({ active: true, trigger, query, startIndex });
    } else {
      setMentionState(null);
    }
  }, []);

  const handleMentionSelect = useCallback(
    (item: { id: string; label: string; type: ContextChip["type"] }) => {
      if (!mentionState) return;
      const before = message.slice(0, mentionState.startIndex);
      const after = message.slice(mentionState.startIndex + 1 + mentionState.query.length);
      setMessage(before + after);
      addContextChip({ id: item.id, type: item.type, label: item.label });
      setMentionState(null);
      textareaRef.current?.focus();
    },
    [mentionState, message, addContextChip],
  );

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      for (const file of arr) {
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) continue;
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) continue;
        const type = file.type.startsWith("image/") ? "image" : "file";
        addContextChip({ type, label: file.name, mimeType: file.type, file });
      }
    },
    [addContextChip],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files);
      e.target.value = "";
    },
    [processFiles],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageItems = Array.from(items).filter((i) => i.type.startsWith("image/"));
      if (!imageItems.length) return;
      e.preventDefault();
      const files = imageItems.map((i) => i.getAsFile()).filter(Boolean) as File[];
      processFiles(files);
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [processFiles]);

  const currentModel = CLAUDE_MODELS.find((m) => m.id === model) ?? CLAUDE_MODELS[0];

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative w-full max-w-[821px] rounded-2xl border border-border bg-secondary/30 transition-shadow",
        isDragging && "ring-2 ring-primary/50",
        className,
      )}
    >
      {isDragging && (
        <div className="inset-0 backdrop-blur-sm pointer-events-none absolute z-10 flex items-center justify-center rounded-2xl bg-background/80">
          <p className="text-sm font-medium text-foreground">Drop files to attach</p>
        </div>
      )}

      {contextChips.length > 0 && (
        <div className="gap-1.5 px-3 pt-3 flex flex-wrap">
          {contextChips.map((chip) => (
            <ContextChipItem key={chip.id} chip={chip} onRemove={removeContextChip} />
          ))}
        </div>
      )}

      <div className="px-4 pt-4 pb-1 relative">
        {mentionState?.active && (
          <MentionPopup
            query={mentionState.query}
            triggerChar={mentionState.trigger}
            onSelect={handleMentionSelect}
            onDismiss={() => setMentionState(null)}
          />
        )}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "text-sm w-full resize-none bg-transparent text-foreground outline-none",
            "leading-relaxed placeholder:text-muted-foreground",
            "max-h-[200px] min-h-[24px]",
          )}
        />
      </div>

      {/* Toolbar */}
      <div className="px-2 pb-2 pt-1 flex items-center justify-between">
        {/* Left: + button + model selector */}
        <div className="gap-0.5 flex items-center">
          {/* + add options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-muted-foreground hover:text-foreground"
                aria-label="Add"
              >
                <Plus className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem className="gap-2" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="size-3.5 text-muted-foreground" />
                <span className="text-sm">Add file</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Grid2x2 className="size-3.5 text-muted-foreground" />
                <span className="text-sm">Add apps</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Link2 className="size-3.5 text-muted-foreground" />
                <span className="text-sm">Add webhook</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2">
                  <Cpu className="size-3.5 text-muted-foreground" />
                  <span className="text-sm">Channel</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  <DropdownMenuItem className="gap-2">
                    <Phone className="size-3.5 text-muted-foreground" />
                    <span className="text-sm">Phone</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Model selector — models only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-9 gap-1.5 px-3 text-xs rounded-full text-muted-foreground hover:text-foreground"
              >
                <ClaudeIcon className="text-sm" />
                <span className="max-w-[110px] truncate">{currentModel.label}</span>
                <ChevronDown className="size-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {CLAUDE_MODELS.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className="gap-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">{m.description}</p>
                  </div>
                  {model === m.id && <Check className="size-3.5 shrink-0 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: mic + send */}
        <div className="gap-2 flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "size-8 rounded-full text-muted-foreground hover:text-foreground",
              isRecording && "text-destructive hover:text-destructive",
            )}
            onClick={() => setIsRecording((r) => !r)}
            aria-label={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </Button>

          <Button
            type="button"
            size="icon"
            className={cn(
              "size-8 rounded-full bg-foreground text-background transition-opacity hover:bg-foreground/90",
              !hasContent && !isStreaming && "opacity-40",
            )}
            disabled={!hasContent && !isStreaming}
            onClick={handleSend}
            aria-label={isStreaming ? "Stop generation" : "Send message"}
          >
            {isStreaming ? <Square className="size-3.5" /> : <ArrowUp className="size-4" />}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
        aria-hidden
      />
    </div>
  );
}
