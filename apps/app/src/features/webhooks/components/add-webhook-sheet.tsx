"use client";

import { useState } from "react";
import { Plus, Trash2, Webhook } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useCreateWebhookMutation } from "../api/mutations";
import type { WebhookAuthType, WebhookCustomHeader } from "../api/types";

interface AddWebhookSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function emptyState() {
  return {
    name: "",
    description: "",
    url: "",
    authType: "none" as WebhookAuthType,
    apiKey: "",
    username: "",
    password: "",
    customHeaderName: "",
    customHeaderValue: "",
    customHeaders: [] as WebhookCustomHeader[],
    newHeaderName: "",
    newHeaderValue: "",
    timeoutSeconds: 30,
    maxRetries: 3,
  };
}

export function AddWebhookSheet({ open, onOpenChange }: AddWebhookSheetProps) {
  const [form, setForm] = useState(emptyState);
  const createWebhook = useCreateWebhookMutation();

  function set<K extends keyof ReturnType<typeof emptyState>>(
    key: K,
    value: ReturnType<typeof emptyState>[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => setForm(emptyState()), 300);
  }

  function addCustomHeader() {
    if (!form.newHeaderName.trim()) return;
    set("customHeaders", [
      ...form.customHeaders,
      { name: form.newHeaderName.trim(), value: form.newHeaderValue },
    ]);
    set("newHeaderName", "");
    set("newHeaderValue", "");
  }

  function removeCustomHeader(index: number) {
    set(
      "customHeaders",
      form.customHeaders.filter((_, i) => i !== index),
    );
  }

  function buildCredentials() {
    if (form.authType === "bearer") return { apiKey: form.apiKey };
    if (form.authType === "basic") return { username: form.username, password: form.password };
    if (form.authType === "custom_header")
      return { headerName: form.customHeaderName, headerValue: form.customHeaderValue };
    return undefined;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createWebhook.mutate(
      {
        name: form.name,
        description: form.description || undefined,
        url: form.url,
        authType: form.authType,
        credentials: buildCredentials(),
        customHeaders: form.customHeaders,
        timeoutSeconds: form.timeoutSeconds,
        maxRetries: form.maxRetries,
      },
      {
        onSuccess: () => {
          toast.success("Webhook added");
          handleClose();
        },
        onError: (err) => {
          toast.error(err.message ?? "Failed to add webhook");
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="gap-0 p-0 flex max-w-full min-w-[600px] flex-col">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <div className="gap-2 flex items-center">
            <Webhook className="size-5 text-muted-foreground" />
            <SheetTitle className="text-base">Add webhook</SheetTitle>
          </div>
          <SheetDescription>
            Register an external webhook endpoint your agents can call.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-6 flex-1 overflow-y-auto">
          <form id="add-webhook-form" onSubmit={handleSubmit} className="gap-5 flex flex-col">
            <div className="gap-1.5 flex flex-col">
              <Label htmlFor="wh-name">Name</Label>
              <Input
                id="wh-name"
                placeholder="e.g. Order notifications"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>

            <div className="gap-1.5 flex flex-col">
              <Label htmlFor="wh-description">
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="wh-description"
                placeholder="What does this webhook do?"
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="resize-none"
              />
            </div>

            <div className="gap-1.5 flex flex-col">
              <Label htmlFor="wh-url">URL</Label>
              <Input
                id="wh-url"
                type="url"
                placeholder="https://example.com/webhook"
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
                required
              />
            </div>

            <div className="gap-1.5 flex flex-col">
              <Label htmlFor="wh-auth-type">Auth type</Label>
              <Select
                value={form.authType}
                onValueChange={(v) => set("authType", v as WebhookAuthType)}
              >
                <SelectTrigger id="wh-auth-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="bearer">Bearer token</SelectItem>
                  <SelectItem value="basic">Basic auth</SelectItem>
                  <SelectItem value="custom_header">Custom header</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.authType === "bearer" && (
              <div className="gap-1.5 flex flex-col">
                <Label htmlFor="wh-api-key">API key</Label>
                <Input
                  id="wh-api-key"
                  type="password"
                  placeholder="Your bearer token"
                  value={form.apiKey}
                  onChange={(e) => set("apiKey", e.target.value)}
                  required
                />
              </div>
            )}

            {form.authType === "basic" && (
              <div className="gap-3 grid grid-cols-2">
                <div className="gap-1.5 flex flex-col">
                  <Label htmlFor="wh-username">Username</Label>
                  <Input
                    id="wh-username"
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) => set("username", e.target.value)}
                    required
                  />
                </div>
                <div className="gap-1.5 flex flex-col">
                  <Label htmlFor="wh-password">Password</Label>
                  <Input
                    id="wh-password"
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {form.authType === "custom_header" && (
              <div className="gap-3 grid grid-cols-2">
                <div className="gap-1.5 flex flex-col">
                  <Label htmlFor="wh-header-name">Header name</Label>
                  <Input
                    id="wh-header-name"
                    placeholder="X-Api-Key"
                    value={form.customHeaderName}
                    onChange={(e) => set("customHeaderName", e.target.value)}
                    required
                  />
                </div>
                <div className="gap-1.5 flex flex-col">
                  <Label htmlFor="wh-header-value">Header value</Label>
                  <Input
                    id="wh-header-value"
                    type="password"
                    placeholder="Value"
                    value={form.customHeaderValue}
                    onChange={(e) => set("customHeaderValue", e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="gap-3 flex flex-col">
              <Label>Custom headers</Label>
              {form.customHeaders.length > 0 && (
                <div className="gap-2 flex flex-col">
                  {form.customHeaders.map((h, i) => (
                    <div
                      key={i}
                      className="gap-2 px-3 py-2 text-sm flex items-center justify-between rounded-md border border-border bg-muted/40"
                    >
                      <span className="text-xs truncate font-mono">
                        {h.name}: {h.value}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCustomHeader(i)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="gap-2 grid grid-cols-[1fr_1fr_auto]">
                <Input
                  placeholder="Header name"
                  value={form.newHeaderName}
                  onChange={(e) => set("newHeaderName", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomHeader();
                    }
                  }}
                />
                <Input
                  placeholder="Value"
                  value={form.newHeaderValue}
                  onChange={(e) => set("newHeaderValue", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomHeader();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addCustomHeader}
                  disabled={!form.newHeaderName.trim()}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="gap-4 flex flex-col">
              <h3 className="text-sm font-medium">Advanced</h3>

              <div className="gap-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <Label>Timeout</Label>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {form.timeoutSeconds}s
                  </span>
                </div>
                <Slider
                  min={1}
                  max={120}
                  step={1}
                  value={[form.timeoutSeconds]}
                  onValueChange={([v]) => set("timeoutSeconds", v ?? form.timeoutSeconds)}
                />
                <p className="text-xs text-muted-foreground">Request timeout in seconds (1–120).</p>
              </div>

              <div className="gap-1.5 flex flex-col">
                <Label htmlFor="wh-max-retries">Max retries</Label>
                <Input
                  id="wh-max-retries"
                  type="number"
                  min={0}
                  max={10}
                  value={form.maxRetries}
                  onChange={(e) =>
                    set("maxRetries", Math.min(10, Math.max(0, Number(e.target.value))))
                  }
                  className="w-24"
                />
                <p className="text-xs text-muted-foreground">
                  How many times to retry on failure (0–10).
                </p>
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 flex items-center justify-between border-t border-border">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-webhook-form" disabled={createWebhook.isPending}>
            {createWebhook.isPending ? "Adding…" : "Add webhook"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
