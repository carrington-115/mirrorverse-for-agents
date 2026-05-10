"use client";

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

const TRIGGER_LABELS: Record<Workflow["triggerType"], string> = {
  "on-click/prompt": "On-click/prompt",
  scheduled: "Scheduled",
  webhook: "Webhook",
};

interface WorkflowsTableProps {
  workflows: Workflow[];
  onDelete: (id: string) => void;
  sortAsc: boolean;
  onSortToggle: () => void;
  hasActiveFilter: boolean;
  totalWorkflows: number;
}

export function WorkflowsTable({
  workflows,
  onDelete,
  sortAsc,
  onSortToggle,
  hasActiveFilter: _hasActiveFilter,
  totalWorkflows,
}: WorkflowsTableProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(workflows.length / 10));

  const SortIcon = workflows.length === 0 ? ArrowUpDown : sortAsc ? ArrowUp : ArrowDown;

  const isEmpty = totalWorkflows === 0;
  const noResults = !isEmpty && workflows.length === 0;

  return (
    <div className="flex w-full flex-col gap-(--md,16px)">
      <div className="w-full overflow-clip rounded-(--radius,10px) border border-border bg-background">
        <div className="h-9 flex w-full items-center border-b border-border bg-(--accent-0,#fafafa)">
          <div className="w-[38px] shrink-0" />
          <div className="flex w-[33px] shrink-0 items-center px-(--xs,8px) py-[10px]">
            <Checkbox className="size-[14px]" />
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

        {workflows.map((w) => (
          <div
            key={w.id}
            className="flex w-full cursor-pointer items-center border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
            onClick={() => router.push(`/workflows/${w.id}`)}
          >
            <div className="flex w-[38px] shrink-0 items-center justify-center py-[7.5px]">
              <GripVertical className="size-4 cursor-grab text-muted-foreground opacity-50" />
            </div>
            <div className="flex w-[33px] shrink-0 items-center px-(--xs,8px) py-[10px]">
              <Checkbox className="size-[14px]" />
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
                onClick={() => onDelete(w.id)}
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
        ))}
      </div>

      {!isEmpty && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="min-h-9 text-sm font-medium flex items-center justify-center rounded-lg px-(--md,16px) py-(--xs,8px) text-(--ghost-foreground,#404040) opacity-50"
            disabled
          >
            Previous
          </button>
          <div className="flex items-center gap-[7px]">
            <div className="min-h-9 shadow-xs flex w-[34px] items-center justify-center rounded-lg border border-(--border-3,#d4d4d4) px-(--md,16px) py-(--xs,8px)">
              <span className="text-sm font-medium leading-5 text-foreground">1</span>
            </div>
            <span className="text-sm font-medium leading-5 text-muted-foreground">
              of {totalPages}
            </span>
          </div>
          <button
            type="button"
            className="min-h-9 text-sm font-medium flex items-center justify-center rounded-lg px-(--md,16px) py-(--xs,8px) text-foreground opacity-50"
            disabled
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
