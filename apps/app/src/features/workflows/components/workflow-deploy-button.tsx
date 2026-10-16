"use client";

import { Loader2, Rocket, Pause } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWorkflowQuery } from "@/features/workflows/api/queries";
import {
  useActivateWorkflowMutation,
  useDeactivateWorkflowMutation,
} from "@/features/workflows/api/mutations";
import { showDeployErrorToast } from "@/features/workflows/lib/deploy-error";

interface WorkflowDeployButtonProps {
  workflowId: string;
  size?: "sm" | "default";
}

export function WorkflowDeployButton({ workflowId, size = "sm" }: WorkflowDeployButtonProps) {
  const { data } = useWorkflowQuery(workflowId);
  const activate = useActivateWorkflowMutation();
  const deactivate = useDeactivateWorkflowMutation();

  const status = data?.workflow?.status;
  const hasUndeployedChanges = data?.deployment?.hasUndeployedChanges ?? false;

  if (!status || status === "archived") return null;

  const h = size === "sm" ? "h-7" : "h-9";
  const isActive = status === "active";

  const deploy = () =>
    activate.mutate(
      { workflowId },
      {
        onSuccess: (res) =>
          toast.success(`${isActive ? "Redeployed" : "Deployed"} v${res.deployedVersionNumber}`),
        onError: showDeployErrorToast,
      },
    );

  const deployButton = (
    <Button
      variant="default"
      size="sm"
      className={`${h} gap-1.5 px-2.5 text-xs`}
      onClick={deploy}
      disabled={activate.isPending}
      title={isActive ? "Deploy the latest saved version" : "Deploy workflow"}
    >
      {activate.isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Rocket className="size-3" />
      )}
      {isActive ? "Redeploy" : "Deploy"}
    </Button>
  );

  if (!isActive) return deployButton;

  return (
    <>
      {hasUndeployedChanges ? deployButton : null}
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
    </>
  );
}
