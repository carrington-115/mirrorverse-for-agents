"use client";

import { useState } from "react";
import { MOCK_WORKFLOWS } from "@/lib/data";
import type { Workflow, WorkflowTriggerType } from "@/lib/types";
import { WorkflowsHeader } from "./workflows-header";
import { WorkflowsTable } from "./workflows-table";

export function WorkflowsShell() {
  const [workflows, setWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [triggerFilter, setTriggerFilter] = useState<WorkflowTriggerType | "all">("all");

  const filtered = workflows
    .filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    .filter((w) => statusFilter === "all" || w.status === statusFilter)
    .filter((w) => triggerFilter === "all" || w.triggerType === triggerFilter)
    .sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));

  const hasActiveFilter = search !== "" || statusFilter !== "all" || triggerFilter !== "all";

  function handleDelete(id: string) {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  function handleReorder(reordered: Workflow[]) {
    setWorkflows((prev) => {
      const reorderedIdSet = new Set(reordered.map((w) => w.id));
      const filteredIndices = prev
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => reorderedIdSet.has(item.id))
        .map(({ idx }) => idx);
      const next = [...prev];
      reordered.forEach((item, i) => {
        next[filteredIndices[i]] = item;
      });
      return next;
    });
  }

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
        onDelete={handleDelete}
        onReorder={handleReorder}
        sortAsc={sortAsc}
        onSortToggle={() => setSortAsc((v) => !v)}
        hasActiveFilter={hasActiveFilter}
        totalWorkflows={workflows.length}
      />
    </div>
  );
}
