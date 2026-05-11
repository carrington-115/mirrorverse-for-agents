"use client";

import Link from "next/link";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { Loader2, Workflow as WorkflowIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface WorkflowCommitArgs {
  summary?: string;
  document?: {
    kind?: "automation" | "voice-agent" | "chat-agent" | "code";
    metadata?: { title?: string };
  };
}

interface WorkflowCommitResult {
  workflowId: string;
  workflowVersionId: string;
  versionNumber: number;
  title: string;
  kind: "automation" | "voice-agent" | "chat-agent" | "code";
}

const KIND_LABEL: Record<WorkflowCommitResult["kind"], string> = {
  automation: "Automation",
  "voice-agent": "Voice agent",
  "chat-agent": "Chat agent",
  code: "Code",
};

export const WorkflowCommitToolUI = makeAssistantToolUI<WorkflowCommitArgs, WorkflowCommitResult>({
  toolName: "workflow_commit",
  render: ({ args, result }) => {
    const title = result?.title ?? args.document?.metadata?.title ?? "New workflow";
    const kind = result?.kind ?? args.document?.kind;
    const isReady = Boolean(result);

    return (
      <div className="gap-3 my-3 p-4 mx-auto flex w-full max-w-[780px] items-center rounded-2xl border border-border bg-card">
        <div className="size-9 grid shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {isReady ? (
            <WorkflowIcon className="size-4" />
          ) : (
            <Loader2 className="size-4 animate-spin" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">
            {isReady ? "Workflow ready" : "Building workflow…"}
            {kind ? ` · ${KIND_LABEL[kind]}` : null}
          </div>
        </div>
        {result ? (
          <Button asChild size="sm" className="h-8 shrink-0">
            <Link href={`/workflows/${result.workflowId}`}>Open</Link>
          </Button>
        ) : null}
      </div>
    );
  },
});
