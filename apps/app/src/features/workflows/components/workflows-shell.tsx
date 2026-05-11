"use client";

import { useMemo, useState } from "react";
import type { Workflow, WorkflowTriggerType } from "@/lib/types";
import { useWorkflowsListQuery } from "@/features/workflows/api/queries";
import { WorkflowsHeader } from "./workflows-header";
import { WorkflowsTable } from "./workflows-table";

type WorkflowRow = {
  id: string;
  name: string;
  status: string;
  kind: string;
  updatedAt: string | Date;
};

function adaptRow(row: WorkflowRow): Workflow {
  const updated = row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);
  return {
    id: row.id,
    name: row.name,
    status: row.status === "active" ? "active" : "inactive",
    triggerType: "on-click/prompt",
    lastUpdated: updated,
  };
}

export function WorkflowsShell() {
  const { data: rows } = useWorkflowsListQuery();
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [triggerFilter, setTriggerFilter] = useState<WorkflowTriggerType | "all">("all");

  const all = useMemo(() => (rows ?? []).map((r) => adaptRow(r as WorkflowRow)), [rows]);

  const filtered = all
    .filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    .filter((w) => statusFilter === "all" || w.status === statusFilter)
    .filter((w) => triggerFilter === "all" || w.triggerType === triggerFilter)
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  const hasActiveFilter = search !== "" || statusFilter !== "all" || triggerFilter !== "all";

  return (
    <div className="flex w-full flex-col gap-(--md,16px)">
      <WorkflowsHeader
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        triggerFilter={triggerFilter}
        onTriggerChange={setTriggerFilter}
      />
      <WorkflowsTable
        workflows={filtered}
        onDelete={() => {}}
        sortAsc={sortAsc}
        onSortToggle={() => setSortAsc((v) => !v)}
        hasActiveFilter={hasActiveFilter}
        totalWorkflows={all.length}
      />
    </div>
  );
}
