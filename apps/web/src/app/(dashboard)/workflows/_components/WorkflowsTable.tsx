"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Ellipsis, GripVertical, Play, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { toast } from "sonner";
import { Workflow } from "@/lib/types";
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

export default function WorkflowsTable({
  workflows,
  onDelete,
  sortAsc,
  onSortToggle,
  hasActiveFilter,
  totalWorkflows,
}: WorkflowsTableProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(workflows.length / 10));

  const SortIcon = workflows.length === 0 ? ArrowUpDown : sortAsc ? ArrowUp : ArrowDown;

  const isEmpty = totalWorkflows === 0;
  const noResults = !isEmpty && workflows.length === 0;

  return (
    <div className="flex flex-col gap-[var(--md,16px)] w-full">
      {/* Table */}
      <div className="bg-background border border-border rounded-[var(--radius,10px)] overflow-clip w-full">

        {/* Header row */}
        <div className="bg-[var(--accent-0,#fafafa)] flex h-9 items-center w-full border-b border-border">
          <div className="w-[38px] shrink-0" />
          <div className="flex items-center w-[33px] shrink-0 px-[var(--xs,8px)] py-[10px]">
            <Checkbox className="size-[14px]" />
          </div>
          <button
            type="button"
            className="flex items-center gap-[var(--xs,8px)] px-[var(--xs,8px)] py-[8px] flex-1 text-left min-w-0"
            onClick={onSortToggle}
          >
            <span className="text-sm font-medium leading-5 text-foreground whitespace-nowrap">
              Workflow
            </span>
            <SortIcon className="size-4 opacity-50 shrink-0" />
          </button>
          <div className="flex items-center w-[214px] shrink-0 px-[var(--xs,8px)] py-[8px]">
            <span className="text-sm font-medium leading-5 text-foreground whitespace-nowrap">Status</span>
          </div>
          <div className="flex items-center w-[187px] shrink-0 px-[var(--xs,8px)] py-[8px]">
            <span className="text-sm font-medium leading-5 text-foreground whitespace-nowrap">Trigger type</span>
          </div>
          <div className="flex items-center w-[200px] shrink-0 px-[var(--xs,8px)] py-[8px]">
            <span className="text-sm font-medium leading-5 text-foreground whitespace-nowrap">Last updated</span>
          </div>
          <div className="w-[187px] shrink-0" />
        </div>

        {/* Empty — no workflows created yet */}
        {isEmpty && (
          <div className="flex items-center justify-center py-16 px-4">
            <Empty className="border border-solid border-border rounded-xl max-w-[448px]">
              <EmptyHeader>
                <EmptyTitle className="text-base font-medium text-foreground">
                  No Workflows Created Yet
                </EmptyTitle>
                <EmptyDescription>
                  Start automating your business processes — create your first workflow
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-[var(--xs,8px)] items-center justify-center flex-wrap">
                  <Button
                    className="gap-[var(--xs,8px)]"
                    onClick={() => toast.info("Create workflow coming soon")}
                  >
                    <Plus className="size-4" />
                    Create your first workflow
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toast.info("Examples coming soon")}
                  >
                    See examples
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          </div>
        )}

        {/* No results — filters/search returned nothing */}
        {noResults && (
          <div className="flex flex-col items-center justify-center py-16 gap-[var(--sm,12px)]">
            <p className="text-sm font-medium text-foreground">No workflows match your search</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter to find what you're looking for
            </p>
          </div>
        )}

        {/* Rows */}
        {workflows.map((w) => (
          <div
            key={w.id}
            className="flex items-center w-full border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => router.push(`/workflows/${w.id}`)}
          >
            {/* Drag handle */}
            <div className="flex items-center justify-center w-[38px] shrink-0 py-[7.5px]">
              <GripVertical className="size-4 text-muted-foreground opacity-50 cursor-grab" />
            </div>
            {/* Checkbox */}
            <div className="flex items-center w-[33px] shrink-0 px-[var(--xs,8px)] py-[10px]">
              <Checkbox className="size-[14px]" />
            </div>
            {/* Workflow name */}
            <div className="flex items-center flex-1 min-w-0 px-[var(--xs,8px)] py-[7.5px]">
              <p className="text-sm font-normal leading-5 text-foreground truncate">
                {w.name}
              </p>
            </div>
            {/* Status badge */}
            <div className="flex items-center w-[214px] shrink-0 p-[var(--xs,8px)]">
              <div
                className={`flex items-center justify-center px-[var(--xs,8px)] py-[var(--3xs,2px)] rounded-lg border text-xs font-medium leading-4 whitespace-nowrap ${
                  w.status === "active"
                    ? "border-border text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                <span
                  className={`mr-1.5 size-1.5 rounded-full shrink-0 inline-block ${
                    w.status === "active" ? "bg-green-500" : "bg-muted-foreground/50"
                  }`}
                />
                {w.status === "active" ? "Active" : "Inactive"}
              </div>
            </div>
            {/* Trigger type badge */}
            <div className="flex items-center w-[187px] shrink-0 p-[var(--xs,8px)]">
              <div className="border border-border flex items-center justify-center px-[var(--xs,8px)] py-[var(--3xs,2px)] rounded-lg">
                <span className="text-xs font-medium leading-4 text-foreground whitespace-nowrap">
                  {TRIGGER_LABELS[w.triggerType]}
                </span>
              </div>
            </div>
            {/* Last updated */}
            <div className="flex items-center w-[200px] shrink-0 px-[var(--xs,8px)] py-[7.5px]">
              <div className="flex flex-col">
                <p className="text-sm font-normal leading-5 text-foreground">
                  {formatDate(w.lastUpdated)}
                </p>
                <p className="text-xs font-normal leading-4 text-muted-foreground">
                  {formatTime(w.lastUpdated)}
                </p>
              </div>
            </div>
            {/* Actions */}
            <div
              className="flex items-center gap-[var(--xs,8px)] w-[187px] shrink-0 px-[var(--xs,8px)] py-[var(--3xs,2px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="flex items-center justify-center min-h-8 px-[var(--sm,12px)] py-[6px] rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => onDelete(w.id)}
                title="Delete workflow"
              >
                <Ellipsis className="size-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="flex items-center justify-center min-h-8 px-[var(--sm,12px)] py-[6px] rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => toast.info(`Run "${w.name}" coming soon`)}
                title="Run workflow"
              >
                <Play className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination — only shown when there are rows */}
      {!isEmpty && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center justify-center min-h-9 px-[var(--md,16px)] py-[var(--xs,8px)] rounded-lg opacity-50 text-sm font-medium text-[var(--ghost-foreground,#404040)]"
            disabled
          >
            Previous
          </button>
          <div className="flex items-center gap-[7px]">
            <div className="border border-[var(--border-3,#d4d4d4)] flex items-center justify-center min-h-9 px-[var(--md,16px)] py-[var(--xs,8px)] rounded-lg shadow-xs w-[34px]">
              <span className="text-sm font-medium leading-5 text-foreground">1</span>
            </div>
            <span className="text-sm font-medium leading-5 text-muted-foreground">
              of {totalPages}
            </span>
          </div>
          <button
            type="button"
            className="flex items-center justify-center min-h-9 px-[var(--md,16px)] py-[var(--xs,8px)] rounded-lg opacity-50 text-sm font-medium text-foreground"
            disabled
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
