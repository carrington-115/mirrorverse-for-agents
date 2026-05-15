"use client";

import { useState, useCallback } from "react";
import { Copy, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UserMessageProps {
  content: string;
  onEdit?: (newContent: string) => void;
  className?: string;
}

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
    <div className="gap-2 flex w-full flex-col">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={Math.max(1, value.split("\n").length)}
        className={cn(
          "w-full resize-none rounded-2xl rounded-tr-sm",
          "px-4 py-2.5 text-sm bg-secondary text-foreground",
          "ring-1 ring-border outline-none focus:ring-foreground/30",
          "leading-relaxed",
        )}
      />
      <div className="gap-2 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-xs rounded-lg"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 px-3 text-xs rounded-lg"
          disabled={!value.trim() || value.trim() === content}
          onClick={() => value.trim() && onSave(value.trim())}
        >
          Send
        </Button>
      </div>
    </div>
  );
}

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
    <div className={cn("gap-1.5 px-1 flex flex-col items-end", className)}>
      {isEditing ? (
        <div className="w-full max-w-[75%]">
          <EditInput
            content={content}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="px-4 py-2.5 text-sm leading-relaxed max-w-[75%] rounded-2xl rounded-tr-sm bg-secondary whitespace-pre-wrap text-foreground">
          {content}
        </div>
      )}

      {!isEditing && (
        <div className="gap-0.5 flex items-center">
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
