"use client";

import { useState } from "react";
import { Plus, Search, Shapes, ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AgentTemplate } from "@/lib/types";
import { MOCK_AGENTS, AGENT_TEMPLATES } from "@/lib/data";
import AgentTable from "./AgentTable";
import AgentTemplateCard from "./AgentTemplateCard";
import {
  AgentTemplateLibraryDialog,
  TemplateDetailSheet,
} from "./AgentTemplateLibraryDialog";
import CreateAgentSheet from "./CreateAgentSheet";

const STATUS_LABELS: Record<string, string> = {
  all: "Status",
  active: "Active",
  paused: "Paused",
  inactive: "Inactive",
};

const DATE_LABELS: Record<string, string> = {
  all: "Last updated",
  today: "Today",
  week: "This week",
  month: "This month",
};

export default function AgentPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [createAgentOpen, setCreateAgentOpen] = useState(false);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<AgentTemplate | null>(null);

  const filtered = MOCK_AGENTS.filter((agent) => {
    const matchesSearch = agent.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;

    const now = new Date();
    let matchesDate = true;
    if (dateFilter === "today") {
      matchesDate =
        agent.lastUpdated.toDateString() === now.toDateString();
    } else if (dateFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      matchesDate = agent.lastUpdated >= startOfWeek;
    } else if (dateFilter === "month") {
      matchesDate =
        agent.lastUpdated.getMonth() === now.getMonth() &&
        agent.lastUpdated.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const hasFilter =
    search !== "" || statusFilter !== "all" || dateFilter !== "all";

  function handleViewDetails(template: AgentTemplate) {
    setSelectedTemplate(template);
    setDetailSheetOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[30px] font-semibold leading-[30px] tracking-[-1px] text-foreground">
          Agents
        </h2>
        <div className="flex items-center gap-4">
          <Button
            className="rounded-full gap-2"
            onClick={() => setCreateAgentOpen(true)}
          >
            <Plus className="size-4" />
            Create agent
          </Button>
          <Button
            variant="secondary"
            className="rounded-full gap-2"
            onClick={() => setTemplateLibraryOpen(true)}
          >
            <Shapes className="size-4" />
            Browse templates
          </Button>
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-[596px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search agents"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                {STATUS_LABELS[statusFilter]}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("paused")}>
                Paused
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                {DATE_LABELS[dateFilter]}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDateFilter("all")}>
                All dates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("today")}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("week")}>
                This week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("month")}>
                This month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />

      {/* Agents table */}
      <AgentTable
        agents={filtered}
        onCreateAgent={() => setCreateAgentOpen(true)}
        onBrowseTemplates={() => setTemplateLibraryOpen(true)}
        hasFilter={hasFilter}
      />

      {/* Template library */}
      <div className="flex flex-col gap-2 mt-8">
        <p className="text-base font-medium text-[var(--unofficial-foreground-alt)]">
          Template library
        </p>
        <div className="grid grid-cols-4 gap-4">
          {AGENT_TEMPLATES.map((template) => (
            <AgentTemplateCard
              key={template.id}
              template={template}
              onViewDetails={handleViewDetails}
              onUseTemplate={() =>
                toast.info(`Using "${template.name}" — coming soon`)
              }
            />
          ))}
        </div>
      </div>

      <CreateAgentSheet open={createAgentOpen} onOpenChange={setCreateAgentOpen} />

      <AgentTemplateLibraryDialog
        open={templateLibraryOpen}
        onOpenChange={setTemplateLibraryOpen}
      />

      <TemplateDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        template={selectedTemplate}
      />
    </div>
  );
}
