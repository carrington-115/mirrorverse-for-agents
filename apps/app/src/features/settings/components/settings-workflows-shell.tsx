"use client";

import { useMemo, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Check, Ellipsis, Loader2, Pause, Play, Plus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import type { Workflow, WorkflowKind } from "@/lib/types";
import { generateSessionId } from "@/features/chat/actions/generate-session-id";
import { useWorkflowsListQuery } from "@/features/workflows/api/queries";
import {
  useActivateWorkflowMutation,
  useDeactivateWorkflowMutation,
  useDeleteWorkflowMutation,
  useRenameWorkflowMutation,
} from "@/features/workflows/api/mutations";
import {
  KIND_LABELS,
  WorkflowActionMenuItems,
} from "@/features/workflows/components/workflow-action-menu-items";
import { showDeployErrorToast } from "@/features/workflows/lib/deploy-error";
import { useSettingsModal } from "../hooks/use-settings-modal";

type WorkflowWithActivity = Workflow & { createdAt: Date; activity: number[] };

type WorkflowRow = {
  id: string;
  name: string;
  status: string;
  kind: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  respondsToSlackMentions: boolean;
  activity: number[];
};

const VALID_KINDS: ReadonlySet<WorkflowKind> = new Set([
  "automation",
  "chat-agent",
  "voice-agent",
  "code",
]);

function adaptRow(row: WorkflowRow): WorkflowWithActivity {
  const updated = row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);
  const created = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
  const kind = (
    VALID_KINDS.has(row.kind as WorkflowKind) ? row.kind : "automation"
  ) as WorkflowKind;
  return {
    id: row.id,
    name: row.name,
    status: row.status === "active" ? "active" : "inactive",
    kind,
    lastUpdated: updated,
    createdAt: created,
    respondsToSlackMentions: row.respondsToSlackMentions,
    activity: row.activity,
  };
}

function WorkflowActivityChart({ activity }: { activity: number[] }) {
  const data = activity.map((count) => ({ count }));
  return (
    <div className="h-8 w-16 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--foreground)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function WorkflowItem({
  w,
  onDelete,
}: {
  w: WorkflowWithActivity;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const { closeSettings } = useSettingsModal();
  const renameMutation = useRenameWorkflowMutation();
  const activateMutation = useActivateWorkflowMutation();
  const deactivateMutation = useDeactivateWorkflowMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(w.name);

  const isStatusToggling = activateMutation.isPending || deactivateMutation.isPending;

  const handleToggleStatus = () => {
    if (w.status === "active") {
      deactivateMutation.mutate(
        { workflowId: w.id },
        {
          onSuccess: () => toast.success(`"${w.name}" deactivated`),
          onError: (err) => toast.error(err.message || "Failed to deactivate workflow"),
        },
      );
    } else {
      activateMutation.mutate(
        { workflowId: w.id },
        {
          onSuccess: () => toast.success(`"${w.name}" activated`),
          onError: showDeployErrorToast,
        },
      );
    }
  };

  const beginRename = () => {
    setDraftName(w.name);
    setIsEditing(true);
  };
  const cancelRename = () => {
    setIsEditing(false);
    setDraftName(w.name);
  };
  const saveRename = async () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === w.name) {
      cancelRename();
      return;
    }
    try {
      await renameMutation.mutateAsync({ workflowId: w.id, name: trimmed });
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename");
    }
  };
  const onNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  };

  const openWorkflow = () => {
    closeSettings();
    router.push(`/workflows/${w.id}`);
  };

  return (
    <Item variant="outline">
      <ItemContent>
        {isEditing ? (
          <div className="gap-1 flex items-center">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={onNameKeyDown}
              autoFocus
              className="h-7 text-sm"
            />
            <Button variant="ghost" size="icon-sm" onClick={saveRename} aria-label="Save">
              <Check className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={cancelRename} aria-label="Cancel">
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <ItemTitle className="cursor-pointer" onClick={openWorkflow}>
            {w.name}
          </ItemTitle>
        )}
        <p className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(w.createdAt, { addSuffix: true })} · Updated{" "}
          {formatDistanceToNow(w.lastUpdated, { addSuffix: true })}
        </p>
        <div className="gap-1.5 mt-1 flex flex-wrap items-center">
          <Badge variant={w.status === "active" ? "default" : "secondary"}>
            {w.status === "active" ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline">{KIND_LABELS[w.kind]}</Badge>
        </div>
      </ItemContent>
      <ItemActions>
        <WorkflowActivityChart activity={w.activity} />
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isStatusToggling}
          onClick={handleToggleStatus}
          aria-label={w.status === "active" ? "Deactivate workflow" : "Activate workflow"}
        >
          {isStatusToggling ? (
            <Loader2 className="size-4 animate-spin" />
          ) : w.status === "active" ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More options">
              <Ellipsis className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <WorkflowActionMenuItems w={w} onRename={beginRename} onDelete={() => onDelete(w.id)} />
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  );
}

function WorkflowSkeletonItem() {
  return (
    <Item variant="outline">
      <ItemContent>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
        <div className="gap-1.5 mt-1 flex">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </ItemContent>
      <ItemActions>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="size-7 rounded-md" />
      </ItemActions>
    </Item>
  );
}

export function WorkflowsSettingsShell() {
  const { data: rows, isLoading } = useWorkflowsListQuery();
  const deleteMutation = useDeleteWorkflowMutation();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { closeSettings } = useSettingsModal();

  const workflows = useMemo(() => (rows ?? []).map((r) => adaptRow(r as WorkflowRow)), [rows]);
  const pendingDelete = workflows.find((w) => w.id === pendingDeleteId) ?? null;

  const handleNewWorkflow = () => {
    startTransition(async () => {
      const newSessionId = await generateSessionId();
      closeSettings();
      router.push(`/mirrorpilot/${newSessionId}`);
    });
  };

  return (
    <div className="gap-6 flex w-full flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Browse, manage, and monitor the activity of your agent workflows.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={handleNewWorkflow} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          New workflow
        </Button>
      </div>
      <Separator />

      {isLoading ? (
        <ItemGroup>
          {Array.from({ length: 3 }).map((_, i) => (
            <WorkflowSkeletonItem key={`workflow-skeleton-${i}`} />
          ))}
        </ItemGroup>
      ) : workflows.length === 0 ? (
        <Empty className="rounded-xl border border-solid border-border">
          <EmptyHeader>
            <EmptyTitle className="text-base font-medium text-foreground">
              No Workflows Created Yet
            </EmptyTitle>
            <EmptyDescription>
              Start automating your business processes — create your first workflow
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button className="gap-(--xs,8px)" onClick={handleNewWorkflow} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create workflow
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ItemGroup>
          {workflows.map((w) => (
            <WorkflowItem key={w.id} w={w} onDelete={setPendingDeleteId} />
          ))}
        </ItemGroup>
      )}

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {pendingDelete?.name ?? "this workflow"}
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteId) {
                  deleteMutation.mutate(
                    { workflowId: pendingDeleteId },
                    {
                      onError: (err) => toast.error(err.message || "Failed to delete workflow"),
                    },
                  );
                }
                setPendingDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
