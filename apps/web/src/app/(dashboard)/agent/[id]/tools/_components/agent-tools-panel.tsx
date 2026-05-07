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
import AddToolSheet from "./add-tool-sheet";

interface AgentToolsPanelProps {
  tools: AgentToolItem[];
}

export default function AgentToolsPanel({ tools }: AgentToolsPanelProps) {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const filtered = tools
    .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  return (
    <>
      <div className="flex w-full flex-col gap-(--sm)">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-(length:--heading-4-font-size) leading-(--heading-4-line-height) text-secondary-foreground">
            Agent tools
          </h2>
          <Button
            variant="outline"
            className="min-h-9 shadow-xs gap-(--xs)"
            onClick={() => setAddSheetOpen(true)}
          >
            <Plus className="size-4" />
            Add tool
          </Button>
        </div>

        <div className="grid grid-cols-[1fr_240px] items-start gap-(--md)">
          <div className="flex flex-col gap-(--sm)">
            <div className="relative w-full">
              <Search className="left-3 size-4 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search tools"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="w-full overflow-hidden rounded-(--radius) border border-border">
              <div className="h-9 flex items-center border-b border-border bg-(--accent-0)">
                <div className="w-[38px] shrink-0" />
                <div className="px-2 flex w-[33px] shrink-0 items-center justify-center">
                  <Checkbox className="size-[14px]" />
                </div>
                <button
                  type="button"
                  className="gap-2 px-2 py-2 flex flex-1 items-center text-left"
                  onClick={() => setSortAsc((v) => !v)}
                >
                  <span className="text-sm font-medium text-foreground">Name</span>
                  <ArrowUpDown className="size-4 opacity-50" />
                </button>
                <div className="px-2 py-2 w-[160px] shrink-0">
                  <span className="text-sm font-medium text-foreground">Date created</span>
                </div>
                <div className="w-[80px] shrink-0" />
              </div>

              {filtered.length === 0 ? (
                <Empty className="py-16 rounded-none border-0">
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
                      className="gap-(--xs)"
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
                    className="flex items-center border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <div className="py-2 px-1 flex w-[38px] shrink-0 items-center justify-center">
                      <GripVertical className="size-4 cursor-grab text-muted-foreground opacity-50" />
                    </div>
                    <div className="px-2 py-2 flex w-[33px] shrink-0 items-center justify-center">
                      <Checkbox className="size-[14px]" />
                    </div>
                    <div className="px-2 flex-1 py-[7.5px]">
                      <div className="flex flex-col">
                        <span className="text-sm leading-5 text-foreground">{tool.name}</span>
                        <span className="text-xs leading-4 text-muted-foreground">
                          {tool.providerLabel}
                        </span>
                      </div>
                    </div>
                    <div className="px-2 w-[160px] shrink-0 py-[7.5px]">
                      <span className="text-sm text-foreground">
                        {formatDate(tool.dateCreated)}
                      </span>
                    </div>
                    <div className="px-2 py-1 flex w-[80px] shrink-0 items-center justify-start">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="size-6 rounded-sm"
                        onClick={() => toast.info(`Delete ${tool.name} — coming soon`)}
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

          <aside className="rounded-(--radius) border border-border bg-(--body-background) p-(--sm)">
            <div className="text-xs font-semibold mb-(--xs) flex items-center gap-(--2xs) text-(--foreground-alt)">
              <Wrench className="size-3" />
              Workflow tools
            </div>
            <div className="gap-1 flex flex-col">
              {tools.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Connect a workflow to see its tools.
                </span>
              ) : (
                tools.map((t) => (
                  <div
                    key={t.id}
                    className="text-xs font-semibold flex items-center gap-(--2xs) rounded-sm bg-secondary px-(--xs) py-(--3xs) text-secondary-foreground"
                  >
                    <ToolProviderIcon provider={t.provider} />
                    {t.providerLabel} {t.name.split("_").slice(1).join("_") || t.name}
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
