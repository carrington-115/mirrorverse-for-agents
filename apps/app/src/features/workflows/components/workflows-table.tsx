"use client";

import { useState } from "react";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, ArrowUpDown, Ellipsis, GripVertical, Play, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import type { Workflow } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/date";

const PAGE_SIZE = 10;

const TRIGGER_LABELS: Record<Workflow["triggerType"], string> = {
  "on-click/prompt": "On-click/prompt",
  scheduled: "Scheduled",
  webhook: "Webhook",
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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex w-full cursor-pointer items-center border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
      onClick={() => router.push(`/workflows/${w.id}`)}
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
      <div className="min-w-0 flex flex-1 items-center px-(--xs,8px) py-[7.5px]">
        <p className="text-sm font-normal leading-5 truncate text-foreground">{w.name}</p>
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
            {TRIGGER_LABELS[w.triggerType]}
          </span>
        </div>
      </div>
      <div className="flex w-[200px] shrink-0 items-center px-(--xs,8px) py-[7.5px]">
        <div className="flex flex-col">
          <p className="text-sm font-normal leading-5 text-foreground">
            {formatDate(w.lastUpdated)}
          </p>
          <p className="text-xs font-normal leading-4 text-muted-foreground">
            {formatTime(w.lastUpdated)}
          </p>
        </div>
      </div>
      <div
        className="flex w-[187px] shrink-0 items-center gap-(--xs,8px) px-(--xs,8px) py-(--3xs,2px)"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="min-h-8 flex items-center justify-center rounded-lg px-(--sm,12px) py-[6px] transition-colors hover:bg-muted/50"
          onClick={onDelete}
          title="Delete workflow"
        >
          <Ellipsis className="size-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          className="min-h-8 flex items-center justify-center rounded-lg px-(--sm,12px) py-[6px] transition-colors hover:bg-muted/50"
          onClick={() => toast.info(`Run "${w.name}" coming soon`)}
          title="Run workflow"
        >
          <Play className="size-4 text-muted-foreground" />
        </button>
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
}

export function WorkflowsTable({
  workflows,
  onDelete,
  onReorder,
  sortAsc,
  onSortToggle,
  hasActiveFilter: _hasActiveFilter,
  totalWorkflows,
}: WorkflowsTableProps) {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const totalPages = Math.max(1, Math.ceil(workflows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = workflows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const SortIcon = workflows.length === 0 ? ArrowUpDown : sortAsc ? ArrowUp : ArrowDown;

  const isEmpty = totalWorkflows === 0;
  const noResults = !isEmpty && workflows.length === 0;

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

  return (
    <div className="flex w-full flex-col gap-(--md,16px)">
      <div className="w-full overflow-clip rounded-(--radius,10px) border border-border bg-background">
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
              Trigger type
            </span>
          </div>
          <div className="flex w-[200px] shrink-0 items-center px-(--xs,8px) py-[8px]">
            <span className="text-sm font-medium leading-5 whitespace-nowrap text-foreground">
              Last updated
            </span>
          </div>
          <div className="w-[187px] shrink-0" />
        </div>

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
                  <Button
                    className="gap-(--xs,8px)"
                    onClick={() => toast.info("Create workflow coming soon")}
                  >
                    <Plus className="size-4" />
                    Create your first workflow
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

        {!isEmpty && !noResults && (
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

      {!isEmpty && (
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
