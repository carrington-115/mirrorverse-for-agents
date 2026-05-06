"use client";

import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MOCK_WORKSPACE_KNOWLEDGE_BASES } from "@/lib/data";

interface AddKnowledgeBaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddKnowledgeBaseSheet({
  open,
  onOpenChange,
}: AddKnowledgeBaseSheetProps) {
  const [search, setSearch] = useState("");

  const filtered = MOCK_WORKSPACE_KNOWLEDGE_BASES.filter((kb) =>
    kb.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="min-w-[480px] max-w-full flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-6 py-5 border-b">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <SheetTitle>Add knowledge base</SheetTitle>
          </div>
          <SheetDescription>
            Choose from your workspace knowledge bases
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Search knowledge bases"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No knowledge bases found.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {filtered.map((kb) => (
                <div
                  key={kb.id}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {kb.name}
                    </span>
                    <a
                      href={kb.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground underline leading-4 truncate"
                    >
                      {kb.sourceLabel}
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full shadow-xs"
                    onClick={() => toast.success(`"${kb.name}" added to agent`)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
