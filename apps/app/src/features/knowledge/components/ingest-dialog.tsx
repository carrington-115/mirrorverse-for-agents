"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useIngestMutation } from "../api/mutations";

type SourceTab = "text" | "url" | "pdf";

export function IngestDialog({ kbId, children }: { kbId: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SourceTab>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();
  const signUploadUrl = useMutation(trpc.knowledge.signUploadUrl.mutationOptions());
  const mutation = useIngestMutation(kbId);

  const reset = () => {
    setText("");
    setUrl("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tab === "text") {
      mutation.mutate(
        { kbId, sourceType: "text", content: text },
        {
          onSuccess: () => {
            setOpen(false);
            reset();
            toast.success("Document queued for ingestion");
          },
          onError: (err) => toast.error(err.message || "Failed to queue document"),
        },
      );
      return;
    }

    if (tab === "url") {
      mutation.mutate(
        { kbId, sourceType: "url", url },
        {
          onSuccess: () => {
            setOpen(false);
            reset();
            toast.success("URL queued for ingestion");
          },
          onError: (err) => toast.error(err.message || "Failed to queue URL"),
        },
      );
      return;
    }

    if (tab === "pdf" && file) {
      setUploading(true);
      try {
        const storageKey = `knowledge/${kbId}/${Date.now()}-${file.name}`;
        const { uploadUrl } = await signUploadUrl.mutateAsync({ storageKey });
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/pdf" },
          body: file,
        });
        if (!uploadRes.ok) throw new Error(uploadRes.statusText);

        mutation.mutate(
          { kbId, sourceType: "pdf", storageKey, fileName: file.name },
          {
            onSuccess: () => {
              setOpen(false);
              reset();
              toast.success("PDF queued for ingestion");
            },
            onError: (err) => toast.error(err.message || "Failed to queue PDF"),
          },
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    }
  };

  const isPending = mutation.isPending || uploading;
  const canSubmit =
    (tab === "text" && text.trim().length > 0) ||
    (tab === "url" && url.trim().length > 0) ||
    (tab === "pdf" && file !== null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="gap-4 flex flex-col">
          <Tabs value={tab} onValueChange={(v) => setTab(v as SourceTab)}>
            <TabsList className="w-full">
              <TabsTrigger value="text" className="flex-1">
                Text
              </TabsTrigger>
              <TabsTrigger value="url" className="flex-1">
                URL
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex-1">
                PDF
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-3">
              <div className="gap-1.5 flex flex-col">
                <Label htmlFor="doc-text">Paste content</Label>
                <Textarea
                  id="doc-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your document content here..."
                  rows={8}
                />
              </div>
            </TabsContent>
            <TabsContent value="url" className="mt-3">
              <div className="gap-1.5 flex flex-col">
                <Label htmlFor="doc-url">URL</Label>
                <Input
                  id="doc-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                />
              </div>
            </TabsContent>
            <TabsContent value="pdf" className="mt-3">
              <div className="gap-1.5 flex flex-col">
                <Label htmlFor="doc-pdf">PDF file</Label>
                <Input
                  id="doc-pdf"
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {uploading ? "Uploading..." : isPending ? "Queuing..." : "Add document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
