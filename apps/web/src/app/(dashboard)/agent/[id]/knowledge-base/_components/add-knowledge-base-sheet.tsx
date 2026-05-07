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

export default function AddKnowledgeBaseSheet({ open, onOpenChange }: AddKnowledgeBaseSheetProps) {
  const [search, setSearch] = useState("");

  const filtered = MOCK_WORKSPACE_KNOWLEDGE_BASES.filter((kb) =>
    kb.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 flex max-w-full min-w-[480px] flex-col">
        <SheetHeader className="px-6 py-5 border-b">
          <div className="gap-2 flex items-center">
            <BookOpen className="size-4 text-muted-foreground" />
            <SheetTitle>Add knowledge base</SheetTitle>
          </div>
          <SheetDescription>Choose from your workspace knowledge bases</SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="left-3 size-4 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search knowledge bases"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 py-2 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm py-8 text-center text-muted-foreground">
              No knowledge bases found.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {filtered.map((kb) => (
                <div key={kb.id} className="py-3 gap-4 flex items-center justify-between">
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-medium truncate text-foreground">{kb.name}</span>
                    <a
                      href={kb.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs leading-4 truncate text-muted-foreground underline"
                    >
                      {kb.sourceLabel}
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-xs shrink-0 rounded-full"
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
