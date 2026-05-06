"use client";

import { useState } from "react";
import { MOCK_WORKFLOWS } from "@/lib/data";
import { Workflow, WorkflowTriggerType } from "@/lib/types";
import WorkflowsHeader from "./WorkflowsHeader";
import WorkflowsTable from "./WorkflowsTable";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [triggerFilter, setTriggerFilter] = useState<WorkflowTriggerType | "all">("all");

  const filtered = workflows
    .filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    .filter((w) => statusFilter === "all" || w.status === statusFilter)
    .filter((w) => triggerFilter === "all" || w.triggerType === triggerFilter)
    .sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );

  const hasActiveFilter = search !== "" || statusFilter !== "all" || triggerFilter !== "all";

  function handleDelete(id: string) {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <div className="flex flex-col gap-[var(--md,16px)] w-full">
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
        sortAsc={sortAsc}
        onSortToggle={() => setSortAsc((v) => !v)}
        hasActiveFilter={hasActiveFilter}
        totalWorkflows={workflows.length}
      />
    </div>
  );
}
