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
      </div>

      <Separator />
    </div>
  );
}
