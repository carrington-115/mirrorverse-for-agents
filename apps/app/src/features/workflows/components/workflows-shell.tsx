"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Workflow, WorkflowKind } from "@/lib/types";
import { useWorkflowsListQuery } from "@/features/workflows/api/queries";
import {
  useDeleteWorkflowMutation,
  useReorderWorkflowsMutation,
} from "@/features/workflows/api/mutations";

import { WorkflowsHeader } from "./workflows-header";
import { WorkflowsTable } from "./workflows-table";

type WorkflowRow = {
  id: string;
  name: string;
  status: string;
  kind: string;
  updatedAt: string | Date;
};

const VALID_KINDS: ReadonlySet<WorkflowKind> = new Set([
  "automation",
  "chat-agent",
  "voice-agent",
  "code",
]);

function adaptRow(row: WorkflowRow): Workflow {
  const updated = row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);
  const kind = (
    VALID_KINDS.has(row.kind as WorkflowKind) ? row.kind : "automation"
  ) as WorkflowKind;
  return {
    id: row.id,
    name: row.name,
    status: row.status === "active" ? "active" : "inactive",
    kind,
    lastUpdated: updated,
  };
}

export function WorkflowsShell() {
  const { data: rows, isLoading } = useWorkflowsListQuery();
  const deleteMutation = useDeleteWorkflowMutation();
  const reorderMutation = useReorderWorkflowsMutation();

  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState<WorkflowKind | "all">("all");

  const all = useMemo(() => (rows ?? []).map((r) => adaptRow(r as WorkflowRow)), [rows]);

  const filtered = all
    .filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    .filter((w) => statusFilter === "all" || w.status === statusFilter)
    .filter((w) => kindFilter === "all" || w.kind === kindFilter)
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  const hasActiveFilter = search !== "" || statusFilter !== "all" || kindFilter !== "all";

  const handleDelete = (id: string) => {
    deleteMutation.mutate(
      { workflowId: id },
      {
        onError: (err) => toast.error(err.message || "Failed to delete workflow"),
      },
    );
  };

  const handleReorder = (next: Workflow[]) => {
    reorderMutation.mutate(
      { workflowIds: next.map((w) => w.id) },
      {
        onError: (err) => toast.error(err.message || "Failed to reorder workflows"),
      },
    );
  };

  return (
    <div className="flex w-full flex-col gap-(--md,16px)">
      <WorkflowsHeader
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        kindFilter={kindFilter}
        onKindChange={setKindFilter}
      />
      <WorkflowsTable
        workflows={filtered}
        onDelete={handleDelete}
        onReorder={handleReorder}
        sortAsc={sortAsc}
        onSortToggle={() => setSortAsc((v) => !v)}
        hasActiveFilter={hasActiveFilter}
        totalWorkflows={all.length}
        isLoading={isLoading}
      />
    </div>
  );
}
