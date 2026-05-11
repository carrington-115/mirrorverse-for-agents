"use client";

import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DateFilter = "all" | "today" | "this_week" | "this_month" | "this_year";
export type TypeFilter = "all" | "MCP" | "Webhook" | "OAuth";

const DATE_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: "All time", value: "all" },
  { label: "Today", value: "today" },
  { label: "This week", value: "this_week" },
  { label: "This month", value: "this_month" },
  { label: "This year", value: "this_year" },
];

const TYPE_OPTIONS: { label: string; value: TypeFilter }[] = [
  { label: "All types", value: "all" },
  { label: "MCP", value: "MCP" },
  { label: "Webhook", value: "Webhook" },
  { label: "OAuth", value: "OAuth" },
];

interface IntegrationsTableToolbarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (v: DateFilter) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (v: TypeFilter) => void;
}

export function IntegrationsTableToolbar({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  typeFilter,
  onTypeFilterChange,
}: IntegrationsTableToolbarProps) {
  const dateLabel =
    dateFilter === "all"
      ? "Filter by date"
      : (DATE_OPTIONS.find((o) => o.value === dateFilter)?.label ?? "Filter by date");
  const typeLabel =
    typeFilter === "all"
      ? "Filter by type"
      : (TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? "Filter by type");

  return (
    <div className="gap-4 flex items-center justify-between">
      {/* Search input */}
      <div className="max-w-xl relative flex-1">
        <Search className="left-3 size-4 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search integrations"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 pl-9 shadow-xs"
        />
      </div>

      {/* Filter pills */}
      <div className="gap-2 flex items-center">
        <FilterPill
          label={dateLabel}
          active={dateFilter !== "all"}
          options={DATE_OPTIONS}
          value={dateFilter}
          onSelect={(v) => onDateFilterChange(v as DateFilter)}
        />
        <FilterPill
          label={typeLabel}
          active={typeFilter !== "all"}
          options={TYPE_OPTIONS}
          value={typeFilter}
          onSelect={(v) => onTypeFilterChange(v as TypeFilter)}
        />
      </div>
    </div>
  );
}

interface FilterPillProps {
  label: string;
  active: boolean;
  options: { label: string; value: string }[];
  value: string;
  onSelect: (v: string) => void;
}

function FilterPill({ label, active, options, value, onSelect }: FilterPillProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "gap-1 px-2 py-0.5 text-xs font-semibold shadow-xs inline-flex cursor-pointer items-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            active && "border-foreground/30 bg-muted",
          )}
        >
          {label}
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn("justify-between", opt.value === value && "font-medium")}
          >
            {opt.label}
            {opt.value === value && <span className="text-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
