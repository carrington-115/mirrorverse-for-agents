"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InputOutputViewer({ data, className }: { data: unknown; className?: string }) {
  const [copied, setCopied] = useState(false);

  if (data === null || data === undefined) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  const text = JSON.stringify(data, null, 2);

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        className="top-2 right-2 absolute z-10"
        onClick={handleCopy}
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </Button>
      <pre className="text-xs p-3 pr-9 max-h-64 overflow-auto rounded-md bg-muted font-mono break-all whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  );
}
