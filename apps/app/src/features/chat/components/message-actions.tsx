"use client";

import { useState } from "react";
import { Check, Copy, Pencil, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface BaseProps {
  onCopy: () => void;
}

interface UserMessageActionsProps extends BaseProps {
  role: "user";
  onEdit: () => void;
}

interface AssistantMessageActionsProps extends BaseProps {
  role: "assistant";
  onRetry: () => void;
}

type MessageActionsProps = UserMessageActionsProps | AssistantMessageActionsProps;

export function MessageActions(props: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      props.onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Copy failed");
    }
  };

  return (
    <div className="gap-1 mt-1 flex items-center opacity-0 transition-opacity group-hover:opacity-100">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={handleCopy}
        aria-label="Copy message"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
      {props.role === "user" ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={props.onEdit}
          aria-label="Edit message"
        >
          <Pencil className="size-3.5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={props.onRetry}
          aria-label="Retry response"
        >
          <RefreshCcw className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
