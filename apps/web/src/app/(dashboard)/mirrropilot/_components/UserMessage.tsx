"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, Check, Pencil } from "lucide-react";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface UserMessageProps {
  content: string;
  onEdit?: (newContent: string) => void;
  className?: string;
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Inline edit input
// ─────────────────────────────────────────

function EditInput({
  content,
  onSave,
  onCancel,
}: {
  content: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(content);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSave(value.trim());
    }
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={Math.max(1, value.split("\n").length)}
        className={cn(
          "w-full resize-none rounded-2xl rounded-tr-sm",
          "bg-secondary px-4 py-2.5 text-sm text-foreground",
          "outline-none ring-1 ring-border focus:ring-foreground/30",
          "leading-relaxed",
        )}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 rounded-lg px-3 text-xs"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 rounded-lg px-3 text-xs"
          disabled={!value.trim() || value.trim() === content}
          onClick={() => value.trim() && onSave(value.trim())}
        >
          Send
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT: UserMessage
// ─────────────────────────────────────────

export function UserMessage({ content, onEdit, className }: UserMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  const handleSaveEdit = useCallback(
    (newContent: string) => {
      setIsEditing(false);
      onEdit?.(newContent);
    },
    [onEdit],
  );

  return (
    <div className={cn("flex flex-col items-end gap-1.5 px-1", className)}>
      {isEditing ? (
        <div className="w-full max-w-[75%]">
          <EditInput
            content={content}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-2.5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}

      {/* Action row — only shown when not editing */}
      {!isEditing && (
        <div className="flex items-center gap-0.5">
          {/* Copy */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            aria-label="Copy message"
          >
            {copied ? (
              <Check className="size-3.5 text-green-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>

          {/* Edit — only if edit handler provided */}
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditing(true)}
              aria-label="Edit message"
            >
              <Pencil className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
