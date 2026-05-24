"use client";

import { Search, ChevronDown, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WorkflowKind } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  all: "Status",
  active: "Active",
  inactive: "Inactive",
};

const KIND_LABELS: Record<string, string> = {
  all: "Type",
  automation: "Automation",
  "chat-agent": "Chat agent",
  "voice-agent": "Voice agent",
  code: "Code",
};

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const KIND_OPTIONS: { label: string; value: WorkflowKind | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Automation", value: "automation" },
  { label: "Chat agent", value: "chat-agent" },
  { label: "Voice agent", value: "voice-agent" },
  { label: "Code", value: "code" },
];

interface WorkflowsHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  kindFilter: WorkflowKind | "all";
  onKindChange: (value: WorkflowKind | "all") => void;
}

export function WorkflowsHeader({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  kindFilter,
  onKindChange,
}: WorkflowsHeaderProps) {
  const statusActive = statusFilter !== "all";
  const kindActive = kindFilter !== "all";

  return (
    <div className="flex w-full flex-col gap-(--md,16px)">
      <div className="gap-2 md:gap-(--md,16px) flex items-center justify-between">
        <div className="relative max-w-[596px] flex-1">
          <Search className="left-3 size-4 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 text-sm"
            placeholder="Search workflows"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="md:flex hidden items-center gap-(--md,16px)">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`gap-1 px-3 py-1 text-xs font-semibold flex items-center rounded-full border transition-colors hover:bg-muted/50 ${
                  kindActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground"
                }`}
              >
                {KIND_LABELS[kindFilter]}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onKindChange("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onKindChange("automation")}>
                Automation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onKindChange("chat-agent")}>
                Chat agent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onKindChange("voice-agent")}>
                Voice agent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onKindChange("code")}>Code</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filters — mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Filters"
              className="h-9 w-9 shadow-xs md:hidden inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Status</DropdownMenuLabel>
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                className={cn("justify-between", opt.value === statusFilter && "font-medium")}
              >
                {opt.label}
                {opt.value === statusFilter && <span className="text-foreground">✓</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Type</DropdownMenuLabel>
            {KIND_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onKindChange(opt.value)}
                className={cn("justify-between", opt.value === kindFilter && "font-medium")}
              >
                {opt.label}
                {opt.value === kindFilter && <span className="text-foreground">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />
    </div>
  );
}
