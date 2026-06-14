"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  File as FileIcon,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Type,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDocumentsQuery } from "../api/queries";
import { useDeleteDocumentMutation } from "../api/mutations";
import { IngestDialog } from "./ingest-dialog";

const SOURCE_ICONS = {
  text: Type,
  url: Globe,
  pdf: FileText,
  image: ImageIcon,
  file: FileIcon,
} as const;

const STATUS_VARIANTS = {
  pending: "secondary",
  processing: "secondary",
  ready: "default",
  failed: "destructive",
} as const;

export function DocumentList({ kbId }: { kbId: string }) {
  const { data: docs, isLoading } = useDocumentsQuery(kbId);
  const deleteMutation = useDeleteDocumentMutation(kbId);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteMutation.mutate(
      { documentId: pendingDeleteId },
      { onError: (err) => toast.error(err.message || "Failed to delete document") },
    );
    setPendingDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rows = docs ?? [];

  return (
    <div className="gap-4 flex flex-col">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} document{rows.length !== 1 ? "s" : ""}
        </p>
        <IngestDialog kbId={kbId}>
          <Button size="sm">Add document</Button>
        </IngestDialog>
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-sm text-center text-muted-foreground">No documents yet.</p>
      ) : (
        <div className="w-full overflow-clip rounded-(--radius,10px) border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((doc) => {
                const Icon = SOURCE_ICONS[doc.sourceType as keyof typeof SOURCE_ICONS] ?? FileText;
                const label = doc.fileName ?? doc.sourceUrl ?? doc.sourceType;
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Icon className="size-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="max-w-xs text-sm truncate">{label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.status === "ready" ? doc.chunkCount : "—"}
                    </TableCell>
                    <TableCell>
                      {doc.status === "failed" && doc.errorMessage ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="destructive" className="cursor-default capitalize">
                              {doc.status}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>{doc.errorMessage}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge
                          variant={
                            STATUS_VARIANTS[doc.status as keyof typeof STATUS_VARIANTS] ??
                            "secondary"
                          }
                          className="capitalize"
                        >
                          {doc.status === "processing" && (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          )}
                          {doc.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDeleteId(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium break-words text-foreground">
                {(() => {
                  const doc = (docs ?? []).find((d) => d.id === pendingDeleteId);
                  return doc?.fileName ?? doc?.sourceUrl ?? doc?.sourceType ?? "this document";
                })()}
              </span>
              . This cannot be undone.
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
