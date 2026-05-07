"use client";

import { useState } from "react";
import { ArrowUpDown, GripVertical, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Agent, AgentWorkflowRef } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/date";
import ConnectedWorkflowPanel from "./connected-workflow-panel";

interface WorkflowsClientPageProps {
  agent: Agent;
}

export default function WorkflowsClientPage({ agent }: WorkflowsClientPageProps) {
  const [connectedWorkflow, setConnectedWorkflow] = useState<AgentWorkflowRef | null>(
    agent.workflows?.find((w) => w.isConnected) ?? null,
  );
  const [selectedWorkflow, setSelectedWorkflow] = useState<AgentWorkflowRef | null>(null);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const allWorkflows: AgentWorkflowRef[] = agent.workflows ?? [];

  const filtered = allWorkflows
    .filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  if (connectedWorkflow) {
    return <ConnectedWorkflowPanel agent={agent} workflow={connectedWorkflow} />;
  }

  return (
    <>
      <div className="flex w-full flex-col gap-(--sm)">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-(length:--heading-4-font-size) leading-(--heading-4-line-height) text-secondary-foreground">
            Connect a workflow
          </h2>
          <Button
            variant="outline"
            className="min-h-9 shadow-xs gap-(--xs)"
            onClick={() => toast.info("Create workflow coming soon")}
          >
            <Plus className="size-4" />
            New workflow
          </Button>
        </div>

        <div className="relative w-full">
          <Search className="left-3 size-4 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search workflows"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full overflow-hidden rounded-(--radius) border border-border">
          <div className="h-9 flex items-center border-b border-border bg-(--accent-0)">
            <div className="w-[38px] shrink-0" />
            <div className="px-2 flex w-[33px] shrink-0 items-center justify-center">
              <Checkbox className="size-[14px]" />
            </div>
            <button
              type="button"
              className="gap-2 px-2 py-2 flex flex-1 items-center text-left"
              onClick={() => setSortAsc((v) => !v)}
            >
              <span className="text-sm font-medium text-foreground">Workflow</span>
              <ArrowUpDown className="size-4 opacity-50" />
            </button>
            <div className="px-2 py-2 w-[214px] shrink-0">
              <span className="text-sm font-medium text-foreground">Status</span>
            </div>
            <div className="px-2 py-2 w-[200px] shrink-0">
              <span className="text-sm font-medium text-foreground">Last updated</span>
            </div>
            <div className="w-[212px] shrink-0" />
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-sm flex items-center justify-center text-muted-foreground">
              No workflows match your search.
            </div>
          ) : (
            filtered.map((w) => (
              <div
                key={w.id}
                className="flex items-center border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
              >
                <div className="py-2 px-1 flex w-[38px] shrink-0 items-center justify-center">
                  <GripVertical className="size-4 cursor-grab text-muted-foreground opacity-50" />
                </div>
                <div className="px-2 py-2 flex w-[33px] shrink-0 items-center justify-center">
                  <Checkbox className="size-[14px]" />
                </div>
                <div className="px-2 flex-1 py-[7.5px]">
                  <span className="text-sm text-foreground">{w.name}</span>
                </div>
                <div className="px-2 w-[214px] shrink-0 py-[7.5px]">
                  <Badge
                    className={
                      w.status === "active"
                        ? "bg-green-600 text-white text-xs font-medium px-2 py-0.5 rounded-[var(--radius-sm)] border border-border"
                        : "text-xs font-medium px-2 py-0.5 rounded-[var(--radius-sm)] border border-border bg-muted text-muted-foreground"
                    }
                  >
                    {w.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="px-2 w-[200px] shrink-0 py-[7.5px]">
                  <div className="flex flex-col">
                    <span className="text-sm leading-5 text-foreground">
                      {formatDate(w.lastUpdated)}
                    </span>
                    <span className="text-xs leading-4 text-muted-foreground">
                      {formatTime(w.lastUpdated)}
                    </span>
                  </div>
                </div>
                <div className="px-2 py-1 flex w-[212px] shrink-0 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-xs rounded-full"
                    onClick={() => setSelectedWorkflow(w)}
                  >
                    Use workflow
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={!!selectedWorkflow} onOpenChange={(v) => !v && setSelectedWorkflow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect workflow</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Connect <span className="font-medium text-foreground">{selectedWorkflow?.name}</span> to
            this agent? You can change this later from the configuration tab.
          </p>
          <DialogFooter className="gap-2 sm:gap-2 flex">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="flex-1"
              onClick={() => {
                if (selectedWorkflow) {
                  setConnectedWorkflow(selectedWorkflow);
                  setSelectedWorkflow(null);
                }
              }}
            >
              Connect workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
