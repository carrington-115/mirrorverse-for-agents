"use client";

import { useMemo } from "react";
import { Loader2, X } from "lucide-react";

import { useWorkflowQuery } from "@/features/workflows/api/queries";
import { DocumentCanvas } from "@/features/workflows/components/document-canvas";
import { extractIconHints, type NodeIconHints } from "@/features/workflows/lib/node-icon";

interface ChatWorkflowSidePanelProps {
  workflowId: string;
  onClose: () => void;
  showControls?: boolean;
}

interface WorkflowDocumentShape {
  readonly nodes: ReadonlyArray<{
    id: string;
    name: string;
    kind: string;
    position: { x: number; y: number };
    hints?: NodeIconHints;
  }>;
  readonly connections: ReadonlyArray<{
    id: string;
    kind: string;
    fromNodeId: string;
    toNodeId: string;
  }>;
}

export function ChatWorkflowSidePanel({
  workflowId,
  onClose,
  showControls = true,
}: ChatWorkflowSidePanelProps) {
  const { data, isLoading } = useWorkflowQuery(workflowId);

  const doc = useMemo<WorkflowDocumentShape | null>(() => {
    const document = data?.version?.document as unknown;
    if (!document || typeof document !== "object") return null;
    const candidate = document as Partial<WorkflowDocumentShape>;
    if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.connections)) return null;
    const nodes = candidate.nodes.map((n) => ({
      ...n,
      hints: extractIconHints(n as Record<string, unknown>),
    }));
    return { nodes, connections: candidate.connections } as WorkflowDocumentShape;
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (!data?.workflow || !doc) {
    return (
      <div className="px-6 text-sm flex h-full w-full items-center justify-center text-center text-muted-foreground">
        No workflow attached to this chat yet.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-(--md,16px) py-(--sm,8px)">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{data.workflow.name}</span>
          <span className="text-xs text-muted-foreground">{data.workflow.kind}</span>
        </div>
        <button
          type="button"
          className="p-1 flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          onClick={onClose}
          title="Close workflow viewer"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <DocumentCanvas
          nodes={doc.nodes}
          connections={doc.connections}
          showControls={showControls}
        />
      </div>
    </div>
  );
}
