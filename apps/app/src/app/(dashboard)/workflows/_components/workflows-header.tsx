"use client";

import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkflowTriggerType } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  all: "Status",
  active: "Active",
  inactive: "Inactive",
};

const TRIGGER_LABELS: Record<string, string> = {
  all: "Trigger type",
  "on-click/prompt": "On-click/prompt",
  scheduled: "Scheduled",
  webhook: "Webhook",
};

interface WorkflowsHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  triggerFilter: string;
  onTriggerChange: (value: WorkflowTriggerType | "all") => void;
}

export default function WorkflowsHeader({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  triggerFilter,
  onTriggerChange,
}: WorkflowsHeaderProps) {
  const statusActive = statusFilter !== "all";
  const triggerActive = triggerFilter !== "all";

  return (
    <div className="flex w-full flex-col gap-(--md,16px)">
      <div className="flex items-center justify-between gap-(--md,16px)">
        <div className="relative max-w-[596px] flex-1">
          <Search className="left-3 size-4 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search workflows"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-(--md,16px)">
          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`gap-1 px-3 py-1 text-xs font-semibold flex items-center rounded-full border transition-colors hover:bg-muted/50 ${
                  statusActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground"
                }`}
              >
                {STATUS_LABELS[statusFilter]}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStatusChange("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("active")}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange("inactive")}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Trigger type filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`gap-1 px-3 py-1 text-xs font-semibold flex items-center rounded-full border transition-colors hover:bg-muted/50 ${
                  triggerActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground"
                }`}
              >
                {TRIGGER_LABELS[triggerFilter]}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onTriggerChange("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTriggerChange("on-click/prompt")}>
                On-click/prompt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTriggerChange("scheduled")}>
                Scheduled
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTriggerChange("webhook")}>
                Webhook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />
    </div>
  );
}
