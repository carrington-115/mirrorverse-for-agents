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

const STATUS_LABEL: Record<ReturnType<typeof readWorkflowCommitStatus>, string> = {
  building: "Building workflow…",
  ready: "Workflow ready",
  failed: "Workflow build failed",
};

export function WorkflowCommitCard({ part }: { part: WorkflowCommitToolPart }) {
  const result = readWorkflowCommitResult(part);
  const status = readWorkflowCommitStatus(part);
  const error = readWorkflowCommitError(part);
  const title = result?.title ?? (status === "failed" ? "Build failed" : "New workflow");
  const kind = result?.kind;

  return (
    <div className="my-3 gap-3 p-4 flex items-center rounded-2xl border border-border bg-card">
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
        <Button asChild size="sm" className="h-8 shrink-0">
          <Link href={`/workflows/${result.workflowId}`}>Open</Link>
        </Button>
      ) : null}
    </div>
  );
}
