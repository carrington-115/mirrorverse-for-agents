"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateKbMutation } from "../api/mutations";

export function CreateKbDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const mutation = useCreateKbMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
          toast.success("Knowledge base created");
        },
        onError: (err) => toast.error(err.message || "Failed to create knowledge base"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New knowledge base</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="gap-4 flex flex-col">
          <div className="gap-1.5 flex flex-col">
            <Label htmlFor="kb-name">Name</Label>
            <Input
              id="kb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Company docs"
              required
            />
          </div>
          <div className="gap-1.5 flex flex-col">
            <Label htmlFor="kb-desc">Description (optional)</Label>
            <Textarea
              id="kb-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what's in this knowledge base"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
