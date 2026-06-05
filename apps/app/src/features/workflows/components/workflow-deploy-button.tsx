"use client";

import { Loader2, Rocket, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkflowQuery } from "@/features/workflows/api/queries";
import {
  useActivateWorkflowMutation,
  useDeactivateWorkflowMutation,
} from "@/features/workflows/api/mutations";

interface WorkflowDeployButtonProps {
  workflowId: string;
  size?: "sm" | "default";
}

export function WorkflowDeployButton({ workflowId, size = "sm" }: WorkflowDeployButtonProps) {
  const { data } = useWorkflowQuery(workflowId);
  const activate = useActivateWorkflowMutation();
  const deactivate = useDeactivateWorkflowMutation();

  const status = data?.workflow?.status;

  if (!status || status === "archived") return null;

  const h = size === "sm" ? "h-7" : "h-9";

  if (status === "active") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`${h} gap-1.5 px-2.5 text-xs text-muted-foreground`}
        onClick={() => deactivate.mutate({ workflowId })}
        disabled={deactivate.isPending}
        title="Deactivate workflow"
      >
        {deactivate.isPending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Pause className="size-3" />
        )}
        Deactivate
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      className={`${h} gap-1.5 px-2.5 text-xs`}
      onClick={() => activate.mutate({ workflowId })}
      disabled={activate.isPending}
      title="Activate workflow"
    >
      {activate.isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Rocket className="size-3" />
      )}
      Activate
    </Button>
  );
}
