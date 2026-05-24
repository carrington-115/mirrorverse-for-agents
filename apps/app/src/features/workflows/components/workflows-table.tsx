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
  Pencil,
  Play,
  Plus,
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

import { useRenameWorkflowMutation } from "@/features/workflows/api/mutations";
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

const KIND_LABELS: Record<Workflow["kind"], string> = {
  automation: "Automation",
  "chat-agent": "Chat agent",
  "voice-agent": "Voice agent",
  code: "Code",
};

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
        <div
          className={`text-xs font-medium leading-4 flex items-center justify-center rounded-lg border px-(--xs,8px) py-(--3xs,2px) whitespace-nowrap ${
            w.status === "active"
              ? "border-border text-foreground"
              : "border-border text-muted-foreground"
          }`}
        >
          <span
            className={`mr-1.5 size-1.5 inline-block shrink-0 rounded-full ${
              w.status === "active" ? "bg-green-500" : "bg-muted-foreground/50"
            }`}
          />
          {w.status === "active" ? "Active" : "Inactive"}
        </div>
      </div>
      <div className="flex w-[187px] shrink-0 items-center p-(--xs,8px)">
        <div className="flex items-center justify-center rounded-lg border border-border px-(--xs,8px) py-(--3xs,2px)">
          <span className="text-xs font-medium leading-4 whitespace-nowrap text-foreground">
            {KIND_LABELS[w.kind]}
          </span>
        </div>
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
            <DropdownMenuItem onClick={() => toast.info(`Run "${w.name}" coming soon`)}>
              <Play className="size-4" />
              Run workflow
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/workflows/${w.id}`,
                  );
                  toast.success("Link copied");
                } catch {
                  toast.error("Failed to copy link");
                }
              }}
            >
              <Copy className="size-4" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={beginRename}>
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info(`Share "${w.name}" coming soon`)}>
              <Share2 className="size-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info(`Restart "${w.name}" coming soon`)}>
              <RefreshCw className="size-4" />
              Restart workflow
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

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
      router.push(`/mirropilot/${newSessionId}`);
    });
  };

  return (
    <div className="flex w-full flex-col gap-(--md,16px)">
      <div className="w-full overflow-x-auto rounded-(--radius,10px) border border-border bg-background">
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
            <div className="flex items-center gap-(--xs,8px) border-b border-border bg-muted/20 px-(--xs,8px) py-[6px]">
              <span className="text-sm font-medium text-foreground">
                {selectedIds.size} selected
              </span>
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
                onClick={() => {
                  selectedIds.forEach((id) => onDelete(id));
                  setSelectedIds(new Set());
                }}
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
              <button
                type="button"
                className="ml-auto flex items-center rounded-md p-[4px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                onClick={() => setSelectedIds(new Set())}
                title="Clear selection"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {isLoading && (
            <div>
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <WorkflowSkeletonRow key={`workflow-skeleton-${i}`} />
              ))}
            </div>
          )}

          {isEmpty && (
            <div className="py-16 px-4 flex items-center justify-center">
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
          )}

          {noResults && (
            <div className="py-16 flex flex-col items-center justify-center gap-(--sm,12px)">
              <p className="text-sm font-medium text-foreground">No workflows match your search</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter to find what you&apos;re looking for
              </p>
            </div>
          )}

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
                    onDelete={() => onDelete(w.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

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
    </div>
  );
}
