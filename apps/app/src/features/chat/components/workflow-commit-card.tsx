import Link from "next/link";
import { AlertCircle, Workflow as WorkflowIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WORKFLOW_KIND_LABEL } from "@/features/chat/config";
import {
  readWorkflowCommitError,
  readWorkflowCommitResult,
  readWorkflowCommitStatus,
  type WorkflowCommitToolPart,
} from "@/features/chat/lib/workflow-commit-tool";
import { WorkflowDocumentViewer } from "./workflow-document-viewer";

const STATUS_LABEL: Record<ReturnType<typeof readWorkflowCommitStatus>, string> = {
  building: "Building workflow…",
  ready: "Workflow ready",
  failed: "Workflow build failed",
};

interface WorkflowCommitCardProps {
  part: WorkflowCommitToolPart;
  onWorkflowSelect?: (workflowId: string) => void;
}

export function WorkflowCommitCard({ part, onWorkflowSelect }: WorkflowCommitCardProps) {
  const result = readWorkflowCommitResult(part);
  const status = readWorkflowCommitStatus(part);
  const error = readWorkflowCommitError(part);
  const title = result?.title ?? (status === "failed" ? "Build failed" : "New workflow");
  const kind = result?.kind;

  const isClickable = !!result && !!onWorkflowSelect;

  return (
    <div className="my-3">
      <div
        className={`gap-3 p-4 flex items-center rounded-2xl border border-border bg-card transition-colors${isClickable ? "cursor-pointer hover:bg-muted/50" : ""}`}
        onClick={isClickable ? () => onWorkflowSelect(result.workflowId) : undefined}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onWorkflowSelect(result.workflowId);
                }
              }
            : undefined
        }
      >
        <div
          className={
            status === "failed"
              ? "size-9 grid shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive"
              : "size-9 grid shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
          }
        >
          {status === "failed" ? (
            <AlertCircle className="size-4" />
          ) : (
            <WorkflowIcon className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">
            {STATUS_LABEL[status]}
            {kind ? ` · ${WORKFLOW_KIND_LABEL[kind]}` : null}
          </div>
          {status === "failed" && error ? (
            <div className="mt-1 text-xs line-clamp-3 text-destructive">{error}</div>
          ) : null}
        </div>
        {result ? (
          <div onClick={(e) => e.stopPropagation()}>
            <Button asChild size="sm" className="h-8 shrink-0">
              <Link href={`/workflows/${result.workflowId}`}>Open</Link>
            </Button>
          </div>
        ) : null}
      </div>
      {result?.document ? (
        <WorkflowDocumentViewer document={result.document} workflowId={result.workflowId} />
      ) : null}
    </div>
  );
}
