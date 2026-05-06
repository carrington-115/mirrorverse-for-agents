"use client";

import { useState } from "react";
import { ArrowUpDown, BookOpen, GripVertical, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AgentKnowledgeItem } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/date";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import AddKnowledgeBaseSheet from "./AddKnowledgeBaseSheet";

interface KnowledgeBasePanelProps {
  items: AgentKnowledgeItem[];
}

export default function KnowledgeBasePanel({ items }: KnowledgeBasePanelProps) {
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const filtered = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );

  return (
    <>
      <div className="flex flex-col gap-[var(--sm)] w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-[length:var(--heading-4-font-size)] font-semibold leading-[var(--heading-4-line-height)] text-secondary-foreground">
            Agent knowledge base
          </h2>
          <Button
            variant="outline"
            className="gap-[var(--xs)] min-h-9 shadow-xs"
            onClick={() => setAddSheetOpen(true)}
          >
            <Plus className="size-4" />
            Add knowledge base
          </Button>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search knowledge base"
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
            <div className="w-[225px] shrink-0 px-2 py-2">
              <span className="text-sm font-medium text-foreground">Created by</span>
            </div>
            <div className="w-[200px] shrink-0 px-2 py-2">
              <span className="text-sm font-medium text-foreground">Last updated</span>
            </div>
            <div className="w-[80px] shrink-0" />
          </div>

          {filtered.length === 0 ? (
            <Empty className="border-0 rounded-none py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BookOpen className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No knowledge bases added</EmptyTitle>
                <EmptyDescription>
                  Add a knowledge base to give your agent context
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  className="gap-[var(--xs)]"
                  onClick={() => setAddSheetOpen(true)}
                >
                  <Plus className="size-4" />
                  Add knowledge base
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
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
                      {item.name}
                    </span>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground underline leading-4"
                    >
                      {item.sourceLabel}
                    </a>
                  </div>
                </div>
                <div className="w-[225px] shrink-0 flex items-center gap-2 px-2 py-[7.5px]">
                  <span
                    className={`size-8 rounded-full ${item.createdByColor} text-white text-sm font-semibold flex items-center justify-center shrink-0`}
                  >
                    {item.createdByInitial}
                  </span>
                  <span className="text-sm text-foreground truncate">
                    {item.createdByEmail}
                  </span>
                </div>
                <div className="w-[200px] shrink-0 px-2 py-[7.5px]">
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground leading-5">
                      {formatDate(item.lastUpdated)}
                    </span>
                    <span className="text-xs text-muted-foreground leading-4">
                      {formatTime(item.lastUpdated)}
                    </span>
                  </div>
                </div>
                <div className="w-[80px] shrink-0 flex items-center justify-start px-2 py-1">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="size-6 rounded-[var(--radius-sm)]"
                    onClick={() =>
                      toast.info(`Delete ${item.name} — coming soon`)
                    }
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddKnowledgeBaseSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} />
    </>
  );
}
