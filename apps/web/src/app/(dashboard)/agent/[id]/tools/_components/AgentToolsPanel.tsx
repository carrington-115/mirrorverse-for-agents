"use client";

import { useState } from "react";
import { ArrowUpDown, GripVertical, Plus, Search, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AgentToolItem } from "@/lib/types";
import { formatDate } from "@/lib/date";
import { ToolProviderIcon } from "../../_components/tool-icons";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import AddToolSheet from "./AddToolSheet";

interface AgentToolsPanelProps {
  tools: AgentToolItem[];
}

export default function AgentToolsPanel({ tools }: AgentToolsPanelProps) {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const filtered = tools
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );

  return (
    <>
      <div className="flex flex-col gap-[var(--sm)] w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-[length:var(--heading-4-font-size)] font-semibold leading-[var(--heading-4-line-height)] text-secondary-foreground">
            Agent tools
          </h2>
          <Button
            variant="outline"
            className="gap-[var(--xs)] min-h-9 shadow-xs"
            onClick={() => setAddSheetOpen(true)}
          >
            <Plus className="size-4" />
            Add tool
          </Button>
        </div>

        <div className="grid grid-cols-[1fr_240px] gap-[var(--md)] items-start">
          <div className="flex flex-col gap-[var(--sm)]">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="Search tools"
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
                  <span className="text-sm font-medium text-foreground">Name</span>
                  <ArrowUpDown className="size-4 opacity-50" />
                </button>
                <div className="w-[160px] shrink-0 px-2 py-2">
                  <span className="text-sm font-medium text-foreground">Date created</span>
                </div>
                <div className="w-[80px] shrink-0" />
              </div>

              {filtered.length === 0 ? (
                <Empty className="border-0 rounded-none py-16">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Wrench className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>No tools added</EmptyTitle>
                    <EmptyDescription>
                      Add tools to extend your agent&apos;s capabilities
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="outline"
                      className="gap-[var(--xs)]"
                      onClick={() => setAddSheetOpen(true)}
                    >
                      <Plus className="size-4" />
                      Add tool
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                filtered.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-[38px] shrink-0 flex items-center justify-center py-2 px-1">
                      <GripVertical className="size-4 text-muted-foreground opacity-50 cursor-grab" />
                    </div>
                    <div className="w-[33px] shrink-0 flex items-center justify-center px-2 py-2">
                      <Checkbox className="size-[14px]" />
                    </div>
                    <div className="flex-1 px-2 py-[7.5px]">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground leading-5">
                          {tool.name}
                        </span>
                        <span className="text-xs text-muted-foreground leading-4">
                          {tool.providerLabel}
                        </span>
                      </div>
                    </div>
                    <div className="w-[160px] shrink-0 px-2 py-[7.5px]">
                      <span className="text-sm text-foreground">
                        {formatDate(tool.dateCreated)}
                      </span>
                    </div>
                    <div className="w-[80px] shrink-0 flex items-center justify-start px-2 py-1">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="size-6 rounded-[var(--radius-sm)]"
                        onClick={() =>
                          toast.info(`Delete ${tool.name} — coming soon`)
                        }
                        aria-label={`Delete ${tool.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-[var(--radius)] border border-border bg-[var(--body-background)] p-[var(--sm)]">
            <div className="flex items-center gap-[var(--2xs)] mb-[var(--xs)] text-xs font-semibold text-[color:var(--foreground-alt)]">
              <Wrench className="size-3" />
              Workflow tools
            </div>
            <div className="flex flex-col gap-1">
              {tools.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Connect a workflow to see its tools.
                </span>
              ) : (
                tools.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-[var(--2xs)] bg-secondary text-secondary-foreground rounded-[var(--radius-sm)] px-[var(--xs)] py-[var(--3xs)] text-xs font-semibold"
                  >
                    <ToolProviderIcon provider={t.provider} />
                    {t.providerLabel}{" "}
                    {t.name.split("_").slice(1).join("_") || t.name}
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>

      <AddToolSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} />
    </>
  );
}
