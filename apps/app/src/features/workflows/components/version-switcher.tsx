"use client";

import { formatDistanceToNow } from "date-fns";
import { Check, ChevronDown, History, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeployWorkflowVersionMutation } from "@/features/workflows/api/mutations";
import { useWorkflowQuery, useWorkflowVersionsQuery } from "@/features/workflows/api/queries";
import { showDeployErrorToast } from "@/features/workflows/lib/deploy-error";

interface VersionSummary {
  id: string;
  versionNumber: number;
  summary: string | null;
  createdAt: string | Date;
}

function formatRelative(dateLike: string | Date): string {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  return formatDistanceToNow(d, { addSuffix: true });
}

interface VersionSwitcherProps {
  workflowId: string;
  currentVersionNumber: number;
  onSelectVersion: (versionNumber: number | null) => void;
}

export function VersionSwitcher({
  workflowId,
  currentVersionNumber,
  onSelectVersion,
}: VersionSwitcherProps) {
  const { data, isLoading } = useWorkflowVersionsQuery(workflowId);
  const { data: workflowData } = useWorkflowQuery(workflowId);
  const deployVersion = useDeployWorkflowVersionMutation();
  const versions = (data?.versions ?? []) as VersionSummary[];
  const latestVersionNumber = versions[0]?.versionNumber ?? currentVersionNumber;
  const isViewingLatest = currentVersionNumber === latestVersionNumber;
  const deployedVersionNumber =
    workflowData?.workflow?.status === "active"
      ? (workflowData.deployment?.versionNumber ?? null)
      : null;
  const canDeployViewed = currentVersionNumber !== deployedVersionNumber;

  const handleDeployViewed = () => {
    const isRollback =
      deployedVersionNumber !== null && currentVersionNumber < deployedVersionNumber;
    deployVersion.mutate(
      { workflowId, versionNumber: currentVersionNumber },
      {
        onSuccess: () =>
          toast.success(
            isRollback
              ? `Rolled back to v${currentVersionNumber}`
              : `Deployed v${currentVersionNumber}`,
          ),
        onError: showDeployErrorToast,
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs font-medium rounded-sm"
          disabled={isLoading || versions.length === 0}
        >
          <History className="size-3" />v{currentVersionNumber}
          {!isViewingLatest ? <span className="text-muted-foreground">(viewing)</span> : null}
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Versions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {versions.map((v) => {
          const isSelected = v.versionNumber === currentVersionNumber;
          const isLatest = v.versionNumber === latestVersionNumber;
          const isDeployed = v.versionNumber === deployedVersionNumber;
          return (
            <DropdownMenuItem
              key={v.id}
              onClick={() => onSelectVersion(isLatest ? null : v.versionNumber)}
              className="gap-1 py-2 flex-col items-start"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">
                  v{v.versionNumber}
                  {isLatest ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">latest</span>
                  ) : null}
                  {isDeployed ? (
                    <span className="ml-2 text-xs font-normal text-primary">live</span>
                  ) : null}
                </span>
                <span className="gap-2 flex items-center">
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(v.createdAt)}
                  </span>
                  {isSelected ? <Check className="size-3" /> : null}
                </span>
              </div>
              {v.summary ? (
                <span className="text-xs line-clamp-2 text-muted-foreground">{v.summary}</span>
              ) : null}
            </DropdownMenuItem>
          );
        })}
        {canDeployViewed && versions.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDeployViewed}
              disabled={deployVersion.isPending}
              className="gap-2 text-xs"
            >
              <Rocket className="size-3" />
              {deployedVersionNumber !== null && currentVersionNumber < deployedVersionNumber
                ? `Roll back to v${currentVersionNumber}`
                : `Deploy v${currentVersionNumber}`}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
