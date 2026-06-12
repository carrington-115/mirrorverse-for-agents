"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Copy,
  Ellipsis,
  GripVertical,
  Loader2,
  MessageSquare,
  MessageSquareOff,
  Pencil,
  Play,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useActivateWorkflowMutation,
  useDeactivateWorkflowMutation,
  useRenameWorkflowMutation,
  useRestartWorkflowMutation,
  useRunWorkflowMutation,
  useSetSlackAgentMutation,
} from "@/features/workflows/api/mutations";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import type { Workflow } from "@/lib/types";
import { generateSessionId } from "@/features/chat/actions/generate-session-id";

const PAGE_SIZE = 10;
const SKELETON_ROWS = 6;

const KIND_LABELS: Record<Workflow["kind"], string> = {
  automation: "Automation",
  "chat-agent": "Chat agent",
  "voice-agent": "Voice agent",
  code: "Code",
};

// ─── Desktop skeleton ────────────────────────────────────────────────────────

function WorkflowSkeletonRow() {
  return (
    <div className="flex w-full items-center border-b border-border last:border-b-0">
      <div className="w-[38px] shrink-0" />
      <div className="flex w-[33px] shrink-0 items-center px-(--xs,8px) py-[10px]">
        <Skeleton className="size-[14px] rounded-sm" />
      </div>
      <div className="min-w-0 flex flex-1 items-center px-(--xs,8px) py-[14px]">
        <Skeleton className="h-4 w-[55%] max-w-[280px]" />
      </div>
      <div className="flex w-[214px] shrink-0 items-center p-(--xs,8px)">
        <Skeleton className="h-5 w-[78px] rounded-lg" />
      </div>
      <div className="flex w-[187px] shrink-0 items-center p-(--xs,8px)">
        <Skeleton className="h-5 w-[96px] rounded-lg" />
      </div>
      <div className="flex w-[200px] shrink-0 items-center px-(--xs,8px) py-[14px]">
        <Skeleton className="h-4 w-[140px]" />
      </div>
      <div className="w-[187px] shrink-0" />
    </div>
  );
}

// ─── Mobile skeleton ─────────────────────────────────────────────────────────

function WorkflowMobileSkeletonItem() {
  return (
    <div className="gap-3 px-4 py-3 flex items-center border-b border-border last:border-b-0">
      <Skeleton className="size-[14px] shrink-0 rounded-sm" />
      <div className="gap-1.5 min-w-0 flex flex-1 flex-col">
        <Skeleton className="h-4 w-[55%] max-w-[200px]" />
        <Skeleton className="h-5 w-[130px] rounded-lg" />
        <Skeleton className="h-3 w-[110px]" />
      </div>
      <Skeleton className="size-8 shrink-0 rounded-lg" />
    </div>
  );
}

// ─── Shared action menu items (used in both desktop + mobile rows) ────────────

function WorkflowActionMenuItems({
  w,
  onRename,
  onDelete,
}: {
  w: Workflow;
  onRename: () => void;
  onDelete: () => void;
}) {
  const runMutation = useRunWorkflowMutation();
  const restartMutation = useRestartWorkflowMutation();
  const activateMutation = useActivateWorkflowMutation();
  const deactivateMutation = useDeactivateWorkflowMutation();
  const setSlackAgentMutation = useSetSlackAgentMutation();

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
          onError: (err) => toast.error(err.message || "Failed to activate workflow"),
        },
      );
    }
  };

  return (
    <>
      <DropdownMenuItem
        disabled={runMutation.isPending}
        onClick={() =>
          runMutation.mutate(
            { workflowId: w.id },
            {
              onSuccess: () => toast.success("Run started"),
              onError: (err) => toast.error(err.message || "Failed to start run"),
            },
          )
        }
      >
        {runMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        Run workflow
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${window.location.origin}/workflows/${w.id}`);
            toast.success("Link copied");
          } catch {
            toast.error("Failed to copy link");
          }
        }}
      >
        <Copy className="size-4" />
        Copy link
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onRename}>
        <Pencil className="size-4" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => toast.info(`Share "${w.name}" coming soon`)}>
        <Share2 className="size-4" />
        Share
      </DropdownMenuItem>
      <DropdownMenuItem disabled={isStatusToggling} onClick={handleToggleStatus}>
        {isStatusToggling ? (
          <Loader2 className="size-4 animate-spin" />
        ) : w.status === "active" ? (
          <PowerOff className="size-4" />
        ) : (
          <Power className="size-4" />
        )}
        {w.status === "active" ? "Deactivate" : "Activate"}
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={restartMutation.isPending || w.status !== "active"}
        onClick={() =>
          restartMutation.mutate(
            { workflowId: w.id },
            {
              onSuccess: () => toast.success(`"${w.name}" restarted`),
              onError: (err) => toast.error(err.message || "Failed to restart workflow"),
            },
          )
        }
      >
        {restartMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Restart workflow
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={setSlackAgentMutation.isPending}
        onClick={() =>
          setSlackAgentMutation.mutate(
            { workflowId: w.id, enabled: !w.respondsToSlackMentions },
            {
              onSuccess: () =>
                toast.success(
                  w.respondsToSlackMentions
                    ? `Slack replies disabled for "${w.name}"`
                    : `"${w.name}" will now reply to Slack mentions`,
                ),
              onError: (err) => toast.error(err.message || "Failed to update Slack agent"),
            },
          )
        }
      >
        {setSlackAgentMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : w.respondsToSlackMentions ? (
          <MessageSquareOff className="size-4" />
        ) : (
          <MessageSquare className="size-4" />
        )}
        {w.respondsToSlackMentions
          ? "Stop replying to Slack mentions"
          : "Respond to Slack mentions"}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
        <Trash2 className="size-4" />
        Delete
      </DropdownMenuItem>
    </>
  );
}

// ─── Shared status + kind badges ─────────────────────────────────────────────

function StatusBadge({ status }: { status: Workflow["status"] }) {
  return (
    <div
      className={`text-xs font-medium leading-4 flex items-center justify-center rounded-lg border px-(--xs,8px) py-(--3xs,2px) whitespace-nowrap ${
        status === "active"
          ? "border-border text-foreground"
          : "border-border text-muted-foreground"
      }`}
    >
      <span
        className={`mr-1.5 size-1.5 inline-block shrink-0 rounded-full ${
          status === "active" ? "bg-green-500" : "bg-muted-foreground/50"
        }`}
      />
      {status === "active" ? "Active" : "Inactive"}
    </div>
  );
}

function KindBadge({ kind }: { kind: Workflow["kind"] }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-border px-(--xs,8px) py-(--3xs,2px)">
      <span className="text-xs font-medium leading-4 whitespace-nowrap text-foreground">
        {KIND_LABELS[kind]}
      </span>
    </div>
  );
}

// ─── Desktop sortable row ─────────────────────────────────────────────────────

function SortableWorkflowRow({
  w,
  selected,
  onToggle,
  onDelete,
}: {
  w: Workflow;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: w.id,
  });
  const renameMutation = useRenameWorkflowMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(w.name);

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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="group flex w-full cursor-pointer items-center border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
      onClick={() => {
        if (isEditing) return;
        router.push(`/workflows/${w.id}`);
      }}
    >
      <div
        className="flex w-[38px] shrink-0 items-center justify-center py-[7.5px]"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4 text-muted-foreground opacity-50" />
        </span>
      </div>
      <div
        className="flex w-[33px] shrink-0 items-center px-(--xs,8px) py-[10px]"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          className="size-[14px]"
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Select ${w.name}`}
        />
      </div>
      <div
        className="min-w-0 flex flex-1 items-center px-(--xs,8px) py-[7.5px]"
        onClick={isEditing ? (e) => e.stopPropagation() : undefined}
      >
        {isEditing ? (
          <div className="gap-1 flex w-full items-center">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={onNameKeyDown}
              autoFocus
              className="h-7 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(e) => {
                e.stopPropagation();
                saveRename();
              }}
              aria-label="Save"
            >
              <Check className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(e) => {
                e.stopPropagation();
                cancelRename();
              }}
              aria-label="Cancel"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <p className="text-sm font-normal leading-5 truncate text-foreground">{w.name}</p>
        )}
      </div>
      <div className="flex w-[214px] shrink-0 items-center p-(--xs,8px)">
        <StatusBadge status={w.status} />
      </div>
      <div className="flex w-[187px] shrink-0 items-center p-(--xs,8px)">
        <KindBadge kind={w.kind} />
      </div>
      <div className="flex w-[200px] shrink-0 items-center px-(--xs,8px) py-[7.5px]">
        <p className="text-sm font-normal leading-5 text-muted-foreground">
          Updated {formatDistanceToNow(w.lastUpdated, { addSuffix: true })}
        </p>
      </div>
      <div
        className="flex w-[187px] shrink-0 items-center justify-end px-(--xs,8px) py-(--3xs,2px)"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="min-h-8 flex items-center justify-center rounded-lg px-(--sm,12px) py-[6px] transition-colors hover:bg-muted/50"
              title="More options"
            >
              <Ellipsis className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <WorkflowActionMenuItems w={w} onRename={beginRename} onDelete={onDelete} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Mobile list item ─────────────────────────────────────────────────────────

function WorkflowMobileItem({
  w,
  selected,
  onToggle,
  onDelete,
}: {
  w: Workflow;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const renameMutation = useRenameWorkflowMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(w.name);

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

  return (
    <div
      className="group gap-3 px-4 py-3 flex cursor-pointer items-center border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
      onClick={() => {
        if (isEditing) return;
        router.push(`/workflows/${w.id}`);
      }}
    >
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          className="size-[14px]"
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Select ${w.name}`}
        />
      </div>
      <div
        className="min-w-0 gap-1 flex flex-1 flex-col"
        onClick={isEditing ? (e) => e.stopPropagation() : undefined}
      >
        {isEditing ? (
          <div className="gap-1 flex items-center">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={onNameKeyDown}
              autoFocus
              className="h-7 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                saveRename();
              }}
              aria-label="Save"
            >
              <Check className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                cancelRename();
              }}
              aria-label="Cancel"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <p className="text-sm font-medium leading-5 truncate text-foreground">{w.name}</p>
        )}
        <div className="gap-1.5 flex flex-wrap items-center">
          <StatusBadge status={w.status} />
          <KindBadge kind={w.kind} />
        </div>
        <p className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(w.lastUpdated, { addSuffix: true })}
        </p>
      </div>
      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="size-8 flex items-center justify-center rounded-lg transition-colors hover:bg-muted/50"
              title="More options"
            >
              <Ellipsis className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <WorkflowActionMenuItems w={w} onRename={beginRename} onDelete={onDelete} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Bulk-selection toolbar (shared) ─────────────────────────────────────────

function BulkActionBar({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <div className="gap-y-1 flex flex-wrap items-center gap-x-(--xs,8px) border-b border-border bg-muted/20 px-(--xs,8px) py-[6px]">
      <span className="text-sm font-medium text-foreground">{count} selected</span>
      <div className="mx-1 h-4 w-px bg-border" />
      <button
        type="button"
        className="gap-1.5 text-sm flex items-center rounded-md px-(--xs,8px) py-[4px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        onClick={() => toast.info("Restart selected coming soon")}
      >
        <RefreshCw className="size-3.5" />
        Restart
      </button>
      <button
        type="button"
        className="gap-1.5 text-sm flex items-center rounded-md px-(--xs,8px) py-[4px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        onClick={() => toast.info("Share selected coming soon")}
      >
        <Share2 className="size-3.5" />
        Share
      </button>
      <button
        type="button"
        className="gap-1.5 text-sm flex items-center rounded-md px-(--xs,8px) py-[4px] text-destructive transition-colors hover:bg-destructive/10"
        onClick={() => toast.info("Bulk delete coming soon")}
      >
        <Trash2 className="size-3.5" />
        Delete
      </button>
      <button
        type="button"
        className="ml-auto flex items-center rounded-md p-[4px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        onClick={onClear}
        title="Clear selection"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ─── Main table component ─────────────────────────────────────────────────────

interface WorkflowsTableProps {
  workflows: Workflow[];
  onDelete: (id: string) => void;
  onReorder?: (workflows: Workflow[]) => void;
  sortAsc: boolean;
  onSortToggle: () => void;
  hasActiveFilter: boolean;
  totalWorkflows: number;
  isLoading?: boolean;
}

export function WorkflowsTable({
  workflows,
  onDelete,
  onReorder,
  sortAsc,
  onSortToggle,
  hasActiveFilter: _hasActiveFilter,
  totalWorkflows,
  isLoading = false,
}: WorkflowsTableProps) {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const totalPages = Math.max(1, Math.ceil(workflows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = workflows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const SortIcon = workflows.length === 0 ? ArrowUpDown : sortAsc ? ArrowUp : ArrowDown;

  const isEmpty = !isLoading && totalWorkflows === 0;
  const noResults = !isLoading && !isEmpty && workflows.length === 0;

  const allPageSelected = pageSlice.length > 0 && pageSlice.every((w) => selectedIds.has(w.id));

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageSlice.forEach((w) => next.delete(w.id));
      } else {
        pageSlice.forEach((w) => next.add(w.id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = workflows.findIndex((w) => w.id === active.id);
    const newIndex = workflows.findIndex((w) => w.id === over.id);
    onReorder?.(arrayMove(workflows, oldIndex, newIndex));
  }

  const handleNewSession = () => {
    startTransition(async () => {
      const newSessionId = await generateSessionId();
      router.push(`/mirrorpilot/${newSessionId}`);
    });
  };

  // ── Empty / no-results shared UI ──────────────────────────────────────────

  const emptyNode = isEmpty ? (
    <div className="px-4 py-16 flex items-center justify-center">
      <Empty className="max-w-[448px] rounded-xl border border-solid border-border">
        <EmptyHeader>
          <EmptyTitle className="text-base font-medium text-foreground">
            No Workflows Created Yet
          </EmptyTitle>
          <EmptyDescription>
            Start automating your business processes — create your first workflow
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-(--xs,8px)">
            <Button className="gap-(--xs,8px)" onClick={handleNewSession}>
              {pending ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
              Create workflow
            </Button>
            <Button variant="outline" onClick={() => toast.info("Examples coming soon")}>
              See examples
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  ) : null;

  const noResultsNode = noResults ? (
    <div className="py-16 flex flex-col items-center justify-center gap-(--sm,12px)">
      <p className="text-sm font-medium text-foreground">No workflows match your search</p>
      <p className="text-sm text-muted-foreground">
        Try adjusting your search or filter to find what you&apos;re looking for
      </p>
    </div>
  ) : null;

  return (
    <div className="flex w-full flex-col gap-(--md,16px)">
      {/* ── Desktop table (md and up) ─────────────────────────────────────── */}
      <div className="md:block hidden w-full overflow-x-auto rounded-(--radius,10px) border border-border bg-background">
        <div className="min-w-[1024px]">
          {/* Header row */}
          <div className="h-9 flex w-full items-center border-b border-border bg-(--accent-0,#fafafa)">
            <div className="w-[38px] shrink-0" />
            <div className="flex w-[33px] shrink-0 items-center px-(--xs,8px) py-[10px]">
              <Checkbox
                className="size-[14px]"
                checked={allPageSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all on page"
              />
            </div>
            <button
              type="button"
              className="min-w-0 flex flex-1 items-center gap-(--xs,8px) px-(--xs,8px) py-[8px] text-left"
              onClick={onSortToggle}
            >
              <span className="text-sm font-medium leading-5 whitespace-nowrap text-foreground">
                Workflow
              </span>
              <SortIcon className="size-4 shrink-0 opacity-50" />
            </button>
            <div className="flex w-[214px] shrink-0 items-center px-(--xs,8px) py-[8px]">
              <span className="text-sm font-medium leading-5 whitespace-nowrap text-foreground">
                Status
              </span>
            </div>
            <div className="flex w-[187px] shrink-0 items-center px-(--xs,8px) py-[8px]">
              <span className="text-sm font-medium leading-5 whitespace-nowrap text-foreground">
                Type
              </span>
            </div>
            <div className="flex w-[200px] shrink-0 items-center px-(--xs,8px) py-[8px]">
              <span className="text-sm font-medium leading-5 whitespace-nowrap text-foreground">
                Last updated
              </span>
            </div>
            <div className="w-[187px] shrink-0" />
          </div>

          {selectedIds.size > 0 && (
            <BulkActionBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())} />
          )}

          {isLoading && (
            <div>
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <WorkflowSkeletonRow key={`workflow-skeleton-${i}`} />
              ))}
            </div>
          )}

          {emptyNode}
          {noResultsNode}

          {!isLoading && !isEmpty && !noResults && (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={pageSlice.map((w) => w.id)}
                strategy={verticalListSortingStrategy}
              >
                {pageSlice.map((w) => (
                  <SortableWorkflowRow
                    key={w.id}
                    w={w}
                    selected={selectedIds.has(w.id)}
                    onToggle={() => toggleOne(w.id)}
                    onDelete={() => setPendingDeleteId(w.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* ── Mobile list (below md) ────────────────────────────────────────── */}
      <div className="md:hidden w-full overflow-hidden rounded-(--radius,10px) border border-border bg-background">
        {/* Mobile header */}
        <div className="h-9 flex w-full items-center border-b border-border bg-(--accent-0,#fafafa)">
          <div
            className="flex w-[42px] shrink-0 items-center justify-center px-(--xs,8px) py-[10px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              className="size-[14px]"
              checked={allPageSelected}
              onCheckedChange={toggleAll}
              aria-label="Select all on page"
            />
          </div>
          <button
            type="button"
            className="flex flex-1 items-center gap-(--xs,8px) px-(--xs,8px) py-[8px] text-left"
            onClick={onSortToggle}
          >
            <span className="text-sm font-medium leading-5 text-foreground">Workflows</span>
            <SortIcon className="size-4 shrink-0 opacity-50" />
          </button>
        </div>

        {selectedIds.size > 0 && (
          <BulkActionBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())} />
        )}

        {isLoading && (
          <div>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <WorkflowMobileSkeletonItem key={`workflow-mobile-skeleton-${i}`} />
            ))}
          </div>
        )}

        {emptyNode}
        {noResultsNode}

        {!isLoading && !isEmpty && !noResults && (
          <div>
            {pageSlice.map((w) => (
              <WorkflowMobileItem
                key={w.id}
                w={w}
                selected={selectedIds.has(w.id)}
                onToggle={() => toggleOne(w.id)}
                onDelete={() => setPendingDeleteId(w.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination (shared) ───────────────────────────────────────────── */}
      {!isLoading && !isEmpty && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="min-h-9 text-sm font-medium flex items-center justify-center rounded-lg px-(--md,16px) py-(--xs,8px) text-(--ghost-foreground,#404040) transition-opacity disabled:opacity-50"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <div className="flex items-center gap-[7px]">
            <div className="min-h-9 shadow-xs flex w-[34px] items-center justify-center rounded-lg border border-(--border-3,#d4d4d4) px-(--md,16px) py-(--xs,8px)">
              <span className="text-sm font-medium leading-5 text-foreground">{safePage}</span>
            </div>
            <span className="text-sm font-medium leading-5 text-muted-foreground">
              of {totalPages}
            </span>
          </div>
          <button
            type="button"
            className="min-h-9 text-sm font-medium flex items-center justify-center rounded-lg px-(--md,16px) py-(--xs,8px) text-foreground transition-opacity disabled:opacity-50"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      {/* ── Delete dialogs ────────────────────────────────────────────────── */}
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
                {workflows.find((w) => w.id === pendingDeleteId)?.name ?? "this workflow"}
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteId) onDelete(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} workflow{selectedIds.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected workflow{selectedIds.size !== 1 ? "s" : ""}.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => {
                selectedIds.forEach((id) => onDelete(id));
                setSelectedIds(new Set());
                setBulkDeleteOpen(false);
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
