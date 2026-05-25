"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Bot, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useKbsQuery } from "../api/queries";
import { useDeleteKbMutation } from "../api/mutations";
import { CreateKbDialog } from "./create-kb-dialog";
import { DocumentList } from "./document-list";

export function KnowledgeShell() {
  const { data: kbs, isLoading } = useKbsQuery();
  const deleteMutation = useDeleteKbMutation();
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [pendingDeleteKbId, setPendingDeleteKbId] = useState<string | null>(null);

  const handleDelete = (kbId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteKbId(kbId);
  };

  const confirmDelete = () => {
    if (!pendingDeleteKbId) return;
    if (selectedKbId === pendingDeleteKbId) setSelectedKbId(null);
    deleteMutation.mutate(
      { kbId: pendingDeleteKbId },
      { onError: (err) => toast.error(err.message || "Failed to delete knowledge base") },
    );
    setPendingDeleteKbId(null);
  };

  const list = kbs ?? [];
  const mirropilotKbs = list.filter((kb) => kb.source === "mirropilot");
  const manualKbs = list.filter((kb) => kb.source !== "mirropilot");
  const selected = list.find((kb) => kb.id === selectedKbId) ?? null;

  if (isLoading) {
    return (
      <div className="gap-6 flex w-full flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-md md:text-xl font-semibold">Knowledge bases</h1>
            <p className="text-sm text-muted-foreground">
              Ground your agents with documents, URLs, and text.
            </p>
          </div>
        </div>
        <Separator />
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="gap-6 flex w-full flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Knowledge bases</h1>
          <p className="text-sm text-muted-foreground">
            Ground your agents with documents, URLs, and text.
          </p>
        </div>
        <CreateKbDialog>
          <Button size="sm">
            <Plus className="mr-1 size-4" />
            New knowledge base
          </Button>
        </CreateKbDialog>
      </div>
      <Separator />

      {list.length === 0 ? (
        /* ── Empty state ─────────────────────────────────── */
        <div className="gap-4 py-16 flex flex-col items-center text-center">
          <BookOpen className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">No knowledge bases yet</p>
            <p className="text-sm text-muted-foreground">
              Create one to start grounding your agents with documents, or upload a file in
              Mirropilot to create one automatically.
            </p>
          </div>
          <CreateKbDialog>
            <Button>Create knowledge base</Button>
          </CreateKbDialog>
        </div>
      ) : (
        <div className="gap-6 lg:grid-cols-[300px_1fr] grid grid-cols-1">
          {/* ── Left panel — KB list ──────────────────────── */}
          <div className="gap-4 flex flex-col">
            {/* Mirropilot section */}
            {mirropilotKbs.length > 0 && (
              <div className="gap-2 flex flex-col">
                <div className="gap-1.5 px-1 flex items-center">
                  <Bot className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                    Mirropilot uploads
                  </span>
                </div>
                {mirropilotKbs.map((kb) => (
                  <KbCard
                    key={kb.id}
                    kb={kb}
                    selected={selectedKbId === kb.id}
                    isPending={deleteMutation.isPending && deleteMutation.variables?.kbId === kb.id}
                    onClick={() => setSelectedKbId(kb.id)}
                    onDelete={handleDelete}
                    badge="Mirropilot"
                  />
                ))}
              </div>
            )}

            {/* Manual section */}
            {manualKbs.length > 0 && (
              <div className="gap-2 flex flex-col">
                {mirropilotKbs.length > 0 && (
                  <div className="px-1">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Your knowledge bases
                    </span>
                  </div>
                )}
                {manualKbs.map((kb) => (
                  <KbCard
                    key={kb.id}
                    kb={kb}
                    selected={selectedKbId === kb.id}
                    isPending={deleteMutation.isPending && deleteMutation.variables?.kbId === kb.id}
                    onClick={() => setSelectedKbId(kb.id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right panel — document list ───────────────── */}
          <div>
            {selected ? (
              <div className="gap-4 flex flex-col">
                <div className="gap-2 flex items-center">
                  <h2 className="font-medium">{selected.name}</h2>
                  <Badge variant="outline" className="text-xs">
                    {selected.id.slice(0, 8)}
                  </Badge>
                  {selected.source === "mirropilot" && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Bot className="size-3" />
                      Mirropilot
                    </Badge>
                  )}
                </div>
                <DocumentList kbId={selected.id} />
              </div>
            ) : (
              <div className="py-16 text-sm flex items-center justify-center text-muted-foreground">
                Select a knowledge base to manage its documents.
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog
        open={pendingDeleteKbId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteKbId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete knowledge base?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {list.find((kb) => kb.id === pendingDeleteKbId)?.name ?? "this knowledge base"}
              </span>{" "}
              and all its documents. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface KbCardProps {
  kb: { id: string; name: string; description?: string | null; source: string };
  selected: boolean;
  isPending: boolean;
  onClick: () => void;
  onDelete: (kbId: string, e: React.MouseEvent) => void;
  badge?: string;
}

function KbCard({ kb, selected, isPending, onClick, onDelete, badge }: KbCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-colors ${selected ? "border-primary" : "hover:border-muted-foreground/30"}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="gap-2 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-medium leading-tight truncate">{kb.name}</CardTitle>
            {badge && (
              <span className="mt-1 gap-1 font-medium inline-flex items-center text-[10px] text-primary">
                <Bot className="size-2.5" />
                {badge}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            onClick={(e) => onDelete(kb.id, e)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Trash2 className="size-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>
      {kb.description && (
        <CardContent className="pb-3 pt-0 px-4">
          <p className="text-xs line-clamp-2 text-muted-foreground">{kb.description}</p>
        </CardContent>
      )}
    </Card>
  );
}
