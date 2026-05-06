"use client";

import { useState } from "react";
import { ArrowUpDown, GripVertical, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AgentWorkflowRef } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/date";

interface ConnectWorkflowPanelProps {
  workflows: AgentWorkflowRef[];
}

export default function ConnectWorkflowPanel({
  workflows,
}: ConnectWorkflowPanelProps) {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = workflows
    .filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );

  return (
    <div className="flex flex-col gap-[var(--sm)] w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-[length:var(--heading-4-font-size)] font-semibold leading-[var(--heading-4-line-height)] text-secondary-foreground">
          Connect a workflow
        </h2>
        <Button
          variant="outline"
          className="gap-[var(--xs)] min-h-9 shadow-xs"
          onClick={() => toast.info("Create workflow coming soon")}
        >
          <Plus className="size-4" />
          New workflow
        </Button>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search workflows"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-[var(--radius)] border border-border overflow-hidden w-full">
        <div className="flex h-9 items-center bg-[var(--accent-0)] border-b border-border">
          <div className="w-[38px] shrink-0" />
          <div className="w-[33px] shrink-0 flex items-center justify-center px-2">
            <Checkbox className="size-[14px]" />
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-2 py-2 flex-1 text-left"
            onClick={() => setSortAsc((v) => !v)}
          >
            <span className="text-sm font-medium text-foreground">
              Workflow
            </span>
            <ArrowUpDown className="size-4 opacity-50" />
          </button>
          <div className="w-[214px] shrink-0 px-2 py-2">
            <span className="text-sm font-medium text-foreground">Status</span>
          </div>
          <div className="w-[200px] shrink-0 px-2 py-2">
            <span className="text-sm font-medium text-foreground">
              Last updated
            </span>
          </div>
          <div className="w-[212px] shrink-0" />
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            No workflows match your search.
          </div>
        ) : (
          filtered.map((w) => (
            <div
              key={w.id}
              className="flex items-center border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              <div className="w-[38px] shrink-0 flex items-center justify-center py-2 px-1">
                <GripVertical className="size-4 text-muted-foreground opacity-50 cursor-grab" />
              </div>
              <div className="w-[33px] shrink-0 flex items-center justify-center px-2 py-2">
                <Checkbox className="size-[14px]" />
              </div>
              <div className="flex-1 px-2 py-[7.5px]">
                <span className="text-sm text-foreground">{w.name}</span>
              </div>
              <div className="w-[214px] shrink-0 px-2 py-[7.5px]">
                <Badge
                  className={
                    w.status === "active"
                      ? "bg-green-600 text-white border border-border rounded-[var(--radius-sm)] text-xs font-medium px-2 py-0.5"
                      : "bg-muted text-muted-foreground border border-border rounded-[var(--radius-sm)] text-xs font-medium px-2 py-0.5"
                  }
                >
                  {w.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="w-[200px] shrink-0 px-2 py-[7.5px]">
                <div className="flex flex-col">
                  <span className="text-sm text-foreground leading-5">
                    {formatDate(w.lastUpdated)}
                  </span>
                  <span className="text-xs text-muted-foreground leading-4">
                    {formatTime(w.lastUpdated)}
                  </span>
                </div>
              </div>
              <div className="w-[212px] shrink-0 flex items-center px-2 py-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full shadow-xs"
                  onClick={() =>
                    toast.info(
                      w.isConnected
                        ? `${w.name} is already connected`
                        : `Connecting ${w.name} — coming soon`,
                    )
                  }
                >
                  {w.isConnected ? "Connected" : "Use workflow"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
