import Link from "next/link";
import { Workflow as WorkflowIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WORKFLOW_KIND_LABEL } from "@/features/chat/config";
import {
  readWorkflowCommitResult,
  readWorkflowCommitStatus,
  type WorkflowCommitToolPart,
} from "@/features/chat/lib/workflow-commit-tool";

const STATUS_LABEL: Record<ReturnType<typeof readWorkflowCommitStatus>, string> = {
  building: "Building workflow…",
  ready: "Workflow ready",
  failed: "Failed",
};

export function WorkflowCommitCard({ part }: { part: WorkflowCommitToolPart }) {
  const result = readWorkflowCommitResult(part);
  const status = readWorkflowCommitStatus(part);
  const title = result?.title ?? "New workflow";
  const kind = result?.kind;

  return (
    <div className="my-3 gap-3 p-4 flex items-center rounded-2xl border border-border bg-card">
      <div className="size-9 grid shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <WorkflowIcon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">
          {STATUS_LABEL[status]}
          {kind ? ` · ${WORKFLOW_KIND_LABEL[kind]}` : null}
        </div>
      </div>
      {result ? (
        <Button asChild size="sm" className="h-8 shrink-0">
          <Link href={`/workflows/${result.workflowId}`}>Open</Link>
        </Button>
      ) : null}
    </div>
  );
}
