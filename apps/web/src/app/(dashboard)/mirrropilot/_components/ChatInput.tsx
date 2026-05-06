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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Plus,
  ChevronDown,
  ArrowUp,
  Mic,
  MicOff,
  X,
  Paperclip,
  ImageIcon,
  Search,
  FileText,
  Settings,
  Workflow,
  AtSign,
  Hash,
  Slash,
  Globe,
  Zap,
  Square,
} from "lucide-react";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export type MirrropilotMode =
  | "auto"
  | "orchestrate"
  | "deep-search"
  | "report"
  | "configure";

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
  defaultMode?: MirrropilotMode;
}

export interface ChatPayload {
  message: string;
  mode: MirrropilotMode;
  context: ContextChip[];
}

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

const MODES: {
  id: MirrropilotMode;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: "auto",
    label: "Auto",
    icon: Square,
    description: "Mirrropilot selects mode",
  },
  {
    id: "orchestrate",
    label: "Orchestrate",
    icon: Workflow,
    description: "Coordinate and supervise agents",
  },
  {
    id: "deep-search",
    label: "Deep search",
    icon: Search,
    description: "Research across all sources",
  },
  {
    id: "report",
    label: "Report",
    icon: FileText,
    description: "Generate structured reports",
  },
  {
    id: "configure",
    label: "Configure",
    icon: Settings,
    description: "Edit tools, agents, workflows",
  },
];

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

// ─────────────────────────────────────────
// SUB-COMPONENT: Mode Badge
// ─────────────────────────────────────────

function ModeBadge({ mode }: { mode: MirrropilotMode }) {
  const config = MODES.find((m) => m.id === mode)!;
  const Icon = config.icon;
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="size-3.5" />
      <span>{config.label}</span>
    </span>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Context Chip
// ─────────────────────────────────────────

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
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
      <Icon className="size-3 shrink-0" />
      <span className="max-w-[120px] truncate">{chip.label}</span>
      <button
        type="button"
        onClick={() => onRemove(chip.id)}
        className="ml-0.5 rounded-full p-0.5 opacity-50 transition-opacity hover:opacity-100"
        aria-label={`Remove ${chip.label}`}
      >
        <X className="size-2.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: @mention Popup
// ─────────────────────────────────────────

const MENTIONABLE_AGENTS = [
  {
    id: "inventory-agent",
    label: "Inventory inquiry agent",
    type: "agent" as const,
  },
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
  onSelect: (item: {
    id: string;
    label: string;
    type: ContextChip["type"];
  }) => void;
  onDismiss: () => void;
}

function MentionPopup({
  query,
  triggerChar,
  onSelect,
  onDismiss,
}: MentionPopupProps) {
  const items = triggerChar === "@" ? MENTIONABLE_AGENTS : MENTIONABLE_TOOLS;
  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  if (!filtered.length) return null;

  return (
    <div className="absolute bottom-full left-0 mb-1 z-50 w-56 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
      <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
        {triggerChar === "@" ? "Agents" : "Tools"}
      </div>
      {filtered.map((item) => {
        const Icon = CHIP_ICONS[item.type];
        return (
          <button
            key={item.id}
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors text-left"
            onClick={() => onSelect(item)}
          >
            <Icon className="size-3.5 text-muted-foreground shrink-0" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT: ChatInput
// ─────────────────────────────────────────

export default function ChatInput({
  onSend,
  onStop,
  placeholder = "How can I help you today?",
  className,
  isStreaming = false,
  defaultMode = "auto",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<MirrropilotMode>(defaultMode);
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

  // ── Auto-resize textarea ──────────────────
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [message, resizeTextarea]);

  // ── Send / Stop ───────────────────────────
  const handleSend = useCallback(() => {
    if (isStreaming) {
      onStop?.();
      return;
    }
    if (!hasContent) return;
    onSend?.({ message: message.trim(), mode, context: contextChips });
    setMessage("");
    setContextChips([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [isStreaming, hasContent, message, mode, contextChips, onSend, onStop]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !mentionState?.active) {
        e.preventDefault();
        handleSend();
      }
      // Dismiss mention on Escape
      if (e.key === "Escape" && mentionState?.active) {
        setMentionState(null);
      }
    },
    [handleSend, mentionState],
  );

  // ── @mention / #tool detection ─────────────
  const handleTextChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setMessage(val);

      const cursor = e.target.selectionStart ?? val.length;
      const textBeforeCursor = val.slice(0, cursor);

      // Detect @ or # trigger
      const match = textBeforeCursor.match(/(?:^|\s)([@#])(\w*)$/);
      if (match) {
        const trigger = match[1] as "@" | "#";
        const query = match[2];
        const startIndex = textBeforeCursor.lastIndexOf(match[1]);
        setMentionState({ active: true, trigger, query, startIndex });
      } else {
        setMentionState(null);
      }
    },
    [],
  );

  const handleMentionSelect = useCallback(
    (item: { id: string; label: string; type: ContextChip["type"] }) => {
      if (!mentionState || contextChips.length >= MAX_CONTEXT_CHIPS) {
        setMentionState(null);
        return;
      }
      // Remove the @/# trigger text from the message
      const before = message.slice(0, mentionState.startIndex);
      const after = message.slice(
        mentionState.startIndex + 1 + mentionState.query.length,
      );
      setMessage(before + after);

      addContextChip({ id: item.id, type: item.type, label: item.label });
      setMentionState(null);
      textareaRef.current?.focus();
    },
    [mentionState, message, contextChips.length],
  );

  // ── Context chips ─────────────────────────
  const addContextChip = useCallback(
    (chip: Omit<ContextChip, "id"> & { id?: string }) => {
      setContextChips((prev) => {
        if (prev.length >= MAX_CONTEXT_CHIPS) return prev;
        if (prev.find((c) => c.label === chip.label)) return prev;
        return [...prev, { ...chip, id: chip.id ?? crypto.randomUUID() }];
      });
    },
    [],
  );

  const removeContextChip = useCallback((id: string) => {
    setContextChips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ── File handling ─────────────────────────
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) return;
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return;

        const type = file.type.startsWith("image/") ? "image" : "file";
        addContextChip({ type, label: file.name, mimeType: file.type, file });
      });
    },
    [addContextChip],
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files);
      e.target.value = "";
    },
    [processFiles],
  );

  // ── Drag and drop ─────────────────────────
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  // ── Paste image ───────────────────────────
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageItems = Array.from(items).filter((i) =>
        i.type.startsWith("image/"),
      );
      if (!imageItems.length) return;
      const files = imageItems
        .map((i) => i.getAsFile())
        .filter(Boolean) as File[];
      if (files.length) processFiles(files);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFiles]);

  // ── Voice recording ───────────────────────
  const toggleRecording = useCallback(() => {
    setIsRecording((prev) => !prev);
    // Wire to Web Speech API or Whisper here
  }, []);

  const currentMode = MODES.find((m) => m.id === mode)!;

  return (
    <TooltipProvider delayDuration={400}>
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex w-full max-w-[821px] flex-col",
          "rounded-2xl border bg-[var(--accent-0)]",
          "px-4 py-3 transition-colors",
          isDragging ? "border-primary/50 bg-primary/5" : "border-transparent",
          className,
        )}
      >
        {/* ── Drag overlay ── */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/80 text-sm font-medium text-muted-foreground">
            Drop files to attach
          </div>
        )}

        {/* ── Context chips bar (shown when chips exist) ── */}
        {contextChips.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {contextChips.map((chip) => (
              <ContextChipItem
                key={chip.id}
                chip={chip}
                onRemove={removeContextChip}
              />
            ))}
          </div>
        )}

        {/* ── Textarea ── */}
        <div className="relative">
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
              "w-full resize-none bg-transparent text-md leading-5",
              "text-foreground placeholder:text-muted-foreground",
              "outline-none border-none p-0",
              "min-h-[40px] max-h-[200px] overflow-y-auto",
            )}
          />
        </div>

        {/* ── Bottom toolbar ── */}
        <div className="mt-3 flex w-full items-center justify-between">
          {/* Left tools */}
          <div className="flex items-center gap-0.5">
            {/* Attach button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach file or image"
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file or image</TooltipContent>
            </Tooltip>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES.join(",")}
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Mode selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <ModeBadge mode={mode} />
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  return (
                    <DropdownMenuItem
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={cn(
                        "flex items-start gap-2.5 py-2.5",
                        mode === m.id && "bg-accent",
                      )}
                    >
                      <Icon className="mt-0.5 size-3.5 shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{m.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.description}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  Auto — Mirrropilot selects mode
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mention agent — @ */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setMessage((prev) => prev + "@");
                    textareaRef.current?.focus();
                  }}
                  aria-label="Mention agent"
                >
                  <AtSign className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mention agent (@)</TooltipContent>
            </Tooltip>

            {/* Mention tool — # */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setMessage((prev) => prev + "#");
                    textareaRef.current?.focus();
                  }}
                  aria-label="Mention tool"
                >
                  <Slash className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mention tool (#)</TooltipContent>
            </Tooltip>
          </div>

          {/* Right tools */}
          <div className="flex items-center gap-2">
            {/* Voice input */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-9 rounded-full text-muted-foreground hover:text-foreground",
                    isRecording && "text-destructive hover:text-destructive",
                  )}
                  onClick={toggleRecording}
                  aria-label={isRecording ? "Stop recording" : "Voice input"}
                >
                  {isRecording ? (
                    <MicOff className="size-4" />
                  ) : (
                    <Mic className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRecording ? "Stop recording" : "Voice input"}
              </TooltipContent>
            </Tooltip>

            {/* Send / Stop */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="size-8 rounded-full"
                  disabled={!hasContent && !isStreaming}
                  onClick={handleSend}
                  aria-label={isStreaming ? "Stop generation" : "Send message"}
                >
                  {isStreaming ? (
                    <Square className="size-3.5 fill-current" />
                  ) : (
                    <ArrowUp className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isStreaming ? "Stop" : "Send (Enter) · New line (Shift+Enter)"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
