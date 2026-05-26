"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface WorkflowDocumentViewerProps {
  document: unknown;
  workflowId: string;
}

export function WorkflowDocumentViewer({ document, workflowId }: WorkflowDocumentViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const doc = document as { nodes?: unknown[]; connections?: unknown[]; name?: string } | null;
  const nodeCount = Array.isArray(doc?.nodes) ? doc.nodes.length : 0;
  const connectionCount = Array.isArray(doc?.connections) ? doc.connections.length : 0;
  const json = JSON.stringify(document, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/30">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="gap-2 px-3 py-2.5 flex w-full items-center text-left transition-colors hover:bg-muted/60"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground">Workflow JSON</span>
        <span className="gap-1 ml-1 flex items-center">
          <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] text-muted-foreground">
            {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
          </span>
          <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] text-muted-foreground">
            {connectionCount} {connectionCount === 1 ? "connection" : "connections"}
          </span>
        </span>
        <div
          className="gap-1.5 ml-auto flex shrink-0 items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[11px] text-muted-foreground"
            onClick={handleCopy}
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[11px] text-muted-foreground"
          >
            <Link href={`/workflows/${workflowId}`}>
              <ExternalLink className="size-3" />
              Open
            </Link>
          </Button>
        </div>
      </button>

      {/* JSON content */}
      {expanded && (
        <div className="max-h-[480px] overflow-auto border-t border-border">
          <pre className="p-3 leading-relaxed font-mono text-[11px] whitespace-pre text-foreground/80">
            {json}
          </pre>
        </div>
      )}
    </div>
  );
}
