"use client";

import { useState } from "react";
import { KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnvVarsQuery } from "@/features/settings/api/queries";
import {
  useDeleteEnvVarMutation,
  useUpsertEnvVarMutation,
} from "@/features/settings/api/mutations";

function AddEnvVarDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const upsert = useUpsertEnvVarMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(
      { name: name.trim(), value },
      {
        onSuccess: () => {
          toast.success(`Variable "${name.trim()}" saved`);
          setName("");
          setValue("");
          setOpen(false);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to save variable");
        },
      },
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName("");
      setValue("");
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add variable
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add environment variable</DialogTitle>
            <DialogDescription>
              Variables are available in workflow nodes as{" "}
              <code className="text-xs px-1 py-0.5 rounded-sm bg-muted font-mono">
                {"{{ $env.NAME }}"}
              </code>
              . Values are stored securely and never shown after saving.
            </DialogDescription>
          </DialogHeader>

          <div className="gap-4 py-4 flex flex-col">
            <Field>
              <FieldLabel htmlFor="env-name">Name</FieldLabel>
              <Input
                id="env-name"
                placeholder="NEWS_API_KEY"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="font-mono"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="env-value">Value</FieldLabel>
              <Input
                id="env-value"
                type="password"
                placeholder="Paste your secret value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || !value || upsert.isPending}>
              {upsert.isPending && <Loader2 className="size-4 animate-spin" />}
              Save variable
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EnvVarRowProps {
  id: string;
  name: string;
  updatedAt: Date | string;
}

function EnvVarRow({ id, name, updatedAt }: EnvVarRowProps) {
  const del = useDeleteEnvVarMutation();

  const handleDelete = () => {
    del.mutate(
      { id },
      {
        onSuccess: () => toast.success(`Variable "${name}" deleted`),
        onError: (err) => toast.error(err.message || "Failed to delete variable"),
      },
    );
  };

  return (
    <div className="gap-3 py-3 flex items-center">
      <code className="min-w-0 text-sm flex-1 truncate font-mono">{name}</code>
      <span className="text-xs shrink-0 text-muted-foreground">
        Updated {new Date(updatedAt).toLocaleDateString()}
      </span>
      <span className="text-xs tracking-widest shrink-0 font-mono text-muted-foreground select-none">
        ••••••••
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={handleDelete}
        disabled={del.isPending}
        title={`Delete ${name}`}
      >
        {del.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
      </Button>
    </div>
  );
}

export function EnvVarsSettingsShell() {
  const { data, isLoading } = useEnvVarsQuery();

  return (
    <div className="gap-6 max-w-2xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Environment variables</h1>
        <p className="text-sm text-muted-foreground">
          Store API keys and secrets that your workflows can reference with{" "}
          <code className="text-xs px-1 py-0.5 rounded-sm bg-muted font-mono">
            {"{{ $env.VAR_NAME }}"}
          </code>
          .
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Variables</CardTitle>
          <CardDescription>
            Values are write-only — they are never shown after saving. To update a value, add a
            variable with the same name.
          </CardDescription>
          <CardAction>
            <AddEnvVarDialog />
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="gap-3 flex flex-col">
              {[1, 2].map((i) => (
                <div key={i} className="gap-3 py-3 flex items-center">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-7 w-7 rounded-sm" />
                </div>
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <div className="divide-y divide-border">
              {data.map((v) => (
                <EnvVarRow key={v.id} id={v.id} name={v.name} updatedAt={v.updatedAt} />
              ))}
            </div>
          ) : (
            <div className="gap-3 py-6 flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-muted">
                <KeyRound className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No variables yet.</p>
              <p className="text-xs max-w-[280px] text-muted-foreground">
                Add your first variable to make API keys and secrets available to workflow nodes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
