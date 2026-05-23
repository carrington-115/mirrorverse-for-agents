"use client";

import { useState } from "react";
import { BookOpen, FileText, Globe, Loader2, Search, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import { useChatKnowledgeDocumentsQuery } from "@/features/knowledge/api/queries";
import { type KbViewToolPart, readKbViewOutput } from "@/features/chat/lib/knowledge-tools";

const SOURCE_ICONS = { text: Type, url: Globe, pdf: FileText } as const;

const STATUS_VARIANTS = {
  pending: "secondary",
  processing: "secondary",
  ready: "default",
  failed: "destructive",
} as const;

type StatusKey = keyof typeof STATUS_VARIANTS;
type SourceKey = keyof typeof SOURCE_ICONS;

interface KnowledgeBaseCardProps {
  part: KbViewToolPart;
  // When provided, documents become selectable and a "Continue" button confirms
  // the picked documents for retrieval. Omitted on historical/streaming messages.
  onConfirmDocuments?: (documentIds: string[], labels: string[]) => void;
}

function docLabel(doc: { fileName: string | null; sourceUrl: string | null; sourceType: string }) {
  return doc.fileName ?? doc.sourceUrl ?? doc.sourceType;
}

export function KnowledgeBaseCard({ part, onConfirmDocuments }: KnowledgeBaseCardProps) {
  const output = readKbViewOutput(part);
  const chatSessionId = output?.chatSessionId ?? null;
  const [search, setSearch] = useState(output?.query ?? "");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const { data: docs, isLoading } = useChatKnowledgeDocumentsQuery(chatSessionId);

  const allDocs = docs ?? [];

  const filtered = allDocs.filter((doc) => {
    if (!search) return true;
    const haystack = [doc.fileName, doc.sourceUrl, doc.sourceType, doc.kbName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  // If a specific document is requested, show detail view for it
  const specificDoc = output?.documentId
    ? (allDocs.find((d) => d.id === output.documentId) ?? null)
    : null;

  const selectable = Boolean(onConfirmDocuments) && !specificDoc;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = () => {
    if (!onConfirmDocuments || selected.size === 0) return;
    const picked = allDocs.filter((d) => selected.has(d.id));
    onConfirmDocuments(
      picked.map((d) => d.id),
      picked.map((d) => docLabel(d)),
    );
  };

  // Empty state — the user has no accessible documents yet
  if (!chatSessionId || (!isLoading && allDocs.length === 0)) {
    return (
      <div className="my-2 gap-3 p-4 flex items-center rounded-xl border border-border bg-muted/30">
        <BookOpen className="size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No knowledge base documents found. Create a knowledge base or attach a PDF or text file to
          this chat to get started.
        </p>
      </div>
    );
  }

  // Detail view for a specific document
  if (specificDoc) {
    const Icon = SOURCE_ICONS[specificDoc.sourceType as SourceKey] ?? FileText;
    const label = docLabel(specificDoc);
    const variant = STATUS_VARIANTS[specificDoc.status as StatusKey] ?? "secondary";

    return (
      <div className="my-2 gap-4 p-4 shadow-sm flex flex-col rounded-xl border border-border bg-background">
        <div className="gap-2 flex items-center">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium min-w-0 flex-1 truncate">{label}</span>
          <Badge variant={variant} className="shrink-0 capitalize">
            {specificDoc.status === "processing" && (
              <Loader2 className="mr-1 size-2.5 animate-spin" />
            )}
            {specificDoc.status}
          </Badge>
        </div>
        <div className="gap-x-6 gap-y-1 text-xs grid grid-cols-2 text-muted-foreground">
          <span className="truncate">Knowledge base: {specificDoc.kbName}</span>
          <span>Type: {specificDoc.sourceType.toUpperCase()}</span>
          <span>Chunks: {specificDoc.status === "ready" ? specificDoc.chunkCount : "—"}</span>
          <span>Added: {new Date(specificDoc.createdAt).toLocaleDateString()}</span>
          {specificDoc.sourceUrl && (
            <span className="col-span-2 truncate">URL: {specificDoc.sourceUrl}</span>
          )}
        </div>
      </div>
    );
  }

  // List view with search (and optional selection for RAG)
  return (
    <div className="my-2 shadow-sm overflow-hidden rounded-xl border border-border bg-background">
      {/* Search bar */}
      <div className="gap-2 px-3 py-2.5 flex shrink-0 items-center border-b border-border bg-muted/30">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <Input
          className="h-6 p-0 text-sm border-0 bg-transparent shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          placeholder="Search files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!isLoading && (
          <span className="text-xs shrink-0 text-muted-foreground">
            {filtered.length} / {allDocs.length}
          </span>
        )}
      </div>

      {selectable && (
        <p className="px-4 pt-2.5 text-xs text-muted-foreground">
          Select the documents you want to use, then continue.
        </p>
      )}

      {/* Document rows */}
      {isLoading ? (
        <div className="py-6 flex items-center justify-center">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-sm text-center text-muted-foreground">
          No files match &ldquo;{search}&rdquo;.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((doc) => {
            const Icon = SOURCE_ICONS[doc.sourceType as SourceKey] ?? FileText;
            const label = docLabel(doc);
            const variant = STATUS_VARIANTS[doc.status as StatusKey] ?? "secondary";
            const isReady = doc.status === "ready";
            const canSelect = selectable && isReady;
            const isChecked = selected.has(doc.id);

            const row = (
              <>
                {selectable && (
                  <Checkbox
                    checked={isChecked}
                    disabled={!canSelect}
                    onCheckedChange={() => canSelect && toggle(doc.id)}
                    aria-label={`Select ${label}`}
                    className="shrink-0"
                  />
                )}
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{label}</p>
                  <p className="text-xs truncate text-muted-foreground">{doc.kbName}</p>
                </div>
                <Badge variant={variant} className="text-xs shrink-0 capitalize">
                  {doc.status === "processing" && (
                    <Loader2 className="mr-1 size-2.5 animate-spin" />
                  )}
                  {doc.status}
                </Badge>
              </>
            );

            return canSelect ? (
              <button
                key={doc.id}
                type="button"
                onClick={() => toggle(doc.id)}
                className="gap-3 px-4 py-3 flex w-full items-center text-left transition-colors hover:bg-muted/50"
              >
                {row}
              </button>
            ) : (
              <div key={doc.id} className="gap-3 px-4 py-3 flex items-center">
                {row}
              </div>
            );
          })}
        </div>
      )}

      {/* Continue button — appears once at least one document is selected */}
      {selectable && selected.size > 0 && (
        <div className="gap-2 px-4 py-3 flex items-center justify-end border-t border-border bg-muted/30">
          <span className="text-xs mr-auto text-muted-foreground">{selected.size} selected</span>
          <Button size="sm" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
