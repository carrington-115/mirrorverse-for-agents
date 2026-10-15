"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  BotMessageSquare,
  Check,
  Loader2,
  Pencil,
  Play,
  Redo2,
  Share2,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import {
  useDeleteWorkflowMutation,
  useRenameWorkflowMutation,
} from "@/features/workflows/api/mutations";
import { useWorkflowQuery } from "@/features/workflows/api/queries";

import { VersionSwitcher } from "./version-switcher";
import { WorkflowDeployButton } from "./workflow-deploy-button";

interface WorkflowHeaderProps {
  workflowId: string;
  workflowName: string;
  workflowKind: string | null;
  workflowStatus: string | null;
  updatedAt: Date | string | null;
  currentVersionNumber: number | null;
  originChatId?: string | null;
  onSelectVersion: (versionNumber: number | null) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  hasManualTrigger?: boolean;
  onRunNow?: () => void;
  isRunning?: boolean;
}

const KIND_LABEL: Record<string, string> = {
  automation: "Automation",
  "chat-agent": "Chat agent",
  "voice-agent": "Voice agent",
  code: "Code",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  active: "default",
  paused: "secondary",
  archived: "secondary",
};

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function WorkflowHeader({
  workflowId,
  workflowName,
  workflowKind,
  workflowStatus,
  updatedAt,
  currentVersionNumber,
  originChatId,
  onSelectVersion,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasManualTrigger,
  onRunNow,
  isRunning,
}: WorkflowHeaderProps) {
  const router = useRouter();
  const renameMutation = useRenameWorkflowMutation();
  const deleteMutation = useDeleteWorkflowMutation();
  const { data: workflowData } = useWorkflowQuery(workflowId);
  const deployment = workflowData?.deployment ?? null;
  const showUndeployedBadge =
    workflowStatus === "active" && (deployment?.hasUndeployedChanges ?? false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(workflowName);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const beginRename = () => {
    setDraftName(workflowName);
    setIsEditingName(true);
  };

  const cancelRename = () => {
    setIsEditingName(false);
    setDraftName(workflowName);
  };

  const saveRename = async () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === workflowName) {
      cancelRename();
      return;
    }
    try {
      await renameMutation.mutateAsync({ workflowId, name: trimmed });
      setIsEditingName(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename");
    }
  };

  const onRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/workflows");
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/workflows/${workflowId}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ workflowId });
      toast.success("Workflow deleted");
      router.push("/workflows");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="px-3 py-2 flex shrink-0 items-center justify-between" style={{ height: 52 }}>
      <div className="gap-3 min-w-0 flex items-center">
        <div className="gap-1 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded-sm"
            onClick={handleBack}
            title="Back to workflows"
          >
            <ArrowLeft className="size-4" />
          </Button>
          {onUndo !== undefined && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-sm"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="size-3.5" />
            </Button>
          )}
          {onRedo !== undefined && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-sm"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="size-3.5" />
            </Button>
          )}
        </div>

        <div className="gap-2 min-w-0 flex items-center">
          {isEditingName ? (
            <div className="gap-1 flex items-center">
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={onRenameKeyDown}
                autoFocus
                className="h-7 text-xs w-[260px]"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={saveRename}
                disabled={renameMutation.isPending}
                aria-label="Save"
              >
                <Check className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={cancelRename}
                aria-label="Cancel"
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={beginRename}
                className="gap-1 px-2 py-0.5 flex items-center rounded-md bg-secondary transition-colors hover:bg-secondary/80"
                title="Rename workflow"
              >
                <span className="text-xs font-semibold max-w-[280px] truncate whitespace-nowrap text-secondary-foreground">
                  {workflowName}
                </span>
                <Pencil className="size-3 text-muted-foreground" />
              </button>
              {workflowKind ? (
                <Badge variant="outline" className="h-6 px-2 text-xs font-normal">
                  {KIND_LABEL[workflowKind] ?? workflowKind}
                </Badge>
              ) : null}
              {workflowStatus ? (
                <Badge
                  variant={STATUS_VARIANT[workflowStatus] ?? "outline"}
                  className="h-6 px-2 text-xs font-normal capitalize"
                >
                  {workflowStatus}
                </Badge>
              ) : null}
              {showUndeployedBadge ? (
                <Badge
                  variant="outline"
                  className="h-6 px-2 text-xs font-normal text-amber-600 border-amber-500/50"
                  title={`Live version is v${deployment?.versionNumber}. Redeploy to publish your latest changes.`}
                >
                  Undeployed changes
                </Badge>
              ) : null}
              {currentVersionNumber != null ? (
                <VersionSwitcher
                  workflowId={workflowId}
                  currentVersionNumber={currentVersionNumber}
                  onSelectVersion={onSelectVersion}
                />
              ) : null}
              {originChatId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                  asChild
                  title="View originating Mirrorpilot chat"
                >
                  <a href={`/mirrorpilot/${originChatId}`}>
                    <BotMessageSquare className="size-3" />
                    View in Mirrorpilot
                  </a>
                </Button>
              ) : null}
              {updatedAt ? (
                <span className="text-xs whitespace-nowrap text-muted-foreground">
                  Updated {formatDistanceToNow(asDate(updatedAt), { addSuffix: true })}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="gap-2 flex items-center">
        {workflowStatus === "active" && hasManualTrigger && onRunNow && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={onRunNow}
            disabled={isRunning}
            title="Trigger a manual run"
          >
            {isRunning ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
            Run now
          </Button>
        )}
        <WorkflowDeployButton workflowId={workflowId} size="sm" />
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-md"
          onClick={handleShare}
          title="Copy link"
        >
          <Share2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-md"
          onClick={() => setDeleteOpen(true)}
          title="Delete workflow"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes <span className="font-medium text-foreground">{workflowName}</span> and
              every version of it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
