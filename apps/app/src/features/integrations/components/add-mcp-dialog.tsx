"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const addMcpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
});

const addWebhookSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
});

export type AddMcpValues = z.infer<typeof addMcpSchema>;
export type AddWebhookValues = z.infer<typeof addWebhookSchema>;

interface AddMcpDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSubmitAction?: (values: AddMcpValues) => void | Promise<void>;
}

export function AddMcpDialog({ open, onOpenChangeAction, onSubmitAction }: AddMcpDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof AddMcpValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setUrl("");
    setErrors({});
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChangeAction(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = addMcpSchema.safeParse({ name, url });
    if (!parsed.success) {
      const next: Partial<Record<keyof AddMcpValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof AddMcpValues;
        next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmitAction?.(parsed.data);
      reset();
      onOpenChangeAction(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-6 gap-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add MCP</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="gap-5 flex flex-col">
          <div className="gap-1.5 flex flex-col">
            <Label htmlFor="add-mcp-name">Name</Label>
            <Input
              id="add-mcp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Value"
              autoFocus
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="gap-1.5 flex flex-col">
            <Label htmlFor="add-mcp-url">Add URL</Label>
            <Input
              id="add-mcp-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL"
              inputMode="url"
            />
            {errors.url ? <p className="text-xs text-destructive">{errors.url}</p> : null}
          </div>

          <div className="gap-3 mt-1 flex">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Adding…" : "Add MCP"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AddWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitAction?: (values: AddWebhookValues) => void | Promise<void>;
}

export function AddWebhookDialog({ open, onOpenChange, onSubmitAction }: AddWebhookDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof AddWebhookValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setUrl("");
    setErrors({});
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = addWebhookSchema.safeParse({ name, url });
    if (!parsed.success) {
      const next: Partial<Record<keyof AddWebhookValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof AddWebhookValues;
        next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmitAction?.(parsed.data);
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-6 gap-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add webhook</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="gap-5 flex flex-col">
          <div className="gap-1.5 flex flex-col">
            <Label htmlFor="add-webhook-name">Name</Label>
            <Input
              id="add-webhook-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My webhook"
              autoFocus
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="gap-1.5 flex flex-col">
            <Label htmlFor="add-webhook-url">Endpoint URL</Label>
            <Input
              id="add-webhook-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              inputMode="url"
            />
            {errors.url ? <p className="text-xs text-destructive">{errors.url}</p> : null}
          </div>

          <div className="gap-3 mt-1 flex">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Adding…" : "Add webhook"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
