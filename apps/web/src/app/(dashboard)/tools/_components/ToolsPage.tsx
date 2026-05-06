"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Webhook, Shapes, Search, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { ToolCard } from "./ToolCard";
import { ToolsTable } from "./ToolsTable";
import { AddWebhookSheet } from "./AddWebhookSheet";
import { Tool } from "@/lib/types";

const SAMPLE_TOOLS: Tool[] = [
  {
    id: "1",
    name: "Order Status Webhook",
    type: "webhook",
    description: "Fetches real-time order status from the fulfillment API for customer support queries.",
    method: "GET",
    url: "https://api.example.com/orders/status",
    status: "active",
    createdAt: new Date("2024-11-10"),
    iconKey: "webhook",
  },
  {
    id: "2",
    name: "Lead Capture Hook",
    type: "webhook",
    description: "Posts new lead data collected by the agent to the CRM system via webhook.",
    method: "POST",
    url: "https://crm.example.com/leads",
    status: "active",
    createdAt: new Date("2024-11-18"),
    iconKey: "webhook",
  },
  {
    id: "3",
    name: "Slack Notifications",
    type: "integration",
    description: "Sends automated Slack messages to the team channel when key events are triggered.",
    status: "active",
    createdAt: new Date("2024-12-01"),
    iconKey: "slack",
  },
  {
    id: "4",
    name: "Inventory Check",
    type: "webhook",
    description: "Queries the warehouse inventory API to check stock levels before confirming orders.",
    method: "GET",
    url: "https://warehouse.example.com/inventory",
    status: "inactive",
    createdAt: new Date("2025-01-05"),
    iconKey: "webhook",
  },
  {
    id: "5",
    name: "Stripe Payments",
    type: "integration",
    description: "Processes payment intents and retrieves transaction history from Stripe.",
    status: "active",
    createdAt: new Date("2025-02-14"),
    iconKey: "stripe",
  },
];

type TypeFilter = "all" | "webhook" | "integration";
type DateSort = "newest" | "oldest";

export function ToolsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tools, setTools] = useState<Tool[]>(SAMPLE_TOOLS);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | undefined>();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dateSort, setDateSort] = useState<DateSort>("newest");

  useEffect(() => {
    if (searchParams.get("addTool") === "1") {
      setWebhookOpen(true);
      router.replace("/tools");
    }
  }, [searchParams, router]);

  const webhookCount = tools.filter((t) => t.type === "webhook").length;
  const integrationCount = tools.filter((t) => t.type === "integration").length;

  function handleAddTool(tool: Tool) {
    setTools((prev) => [...prev, tool]);
  }

  function handleSaveTool(updated: Tool) {
    setTools((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleDelete(id: string) {
    setTools((prev) => prev.filter((t) => t.id !== id));
  }

  function handleToggleStatus(id: string) {
    setTools((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "active" ? "inactive" : "active" }
          : t,
      ),
    );
  }

  function handleEdit(tool: Tool) {
    setEditingTool(tool);
    setWebhookOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setWebhookOpen(open);
    if (!open) setEditingTool(undefined);
  }

  const filteredTools = tools
    .filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) =>
      dateSort === "newest"
        ? b.createdAt.getTime() - a.createdAt.getTime()
        : a.createdAt.getTime() - b.createdAt.getTime(),
    );

  const TYPE_LABELS: Record<TypeFilter, string> = {
    all: "All types",
    webhook: "Webhook",
    integration: "Integration",
  };

  const DATE_LABELS: Record<DateSort, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
  };

  return (
    <div className="w-full flex flex-col gap-[var(--xl,24px)]">
      {/* Section header */}
      <div className="flex flex-col gap-[var(--lg,20px)]">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Tools
          </h2>
          <span className="inline-flex items-center justify-center rounded-lg border border-border px-2 py-0.5 text-xs font-semibold text-foreground">
            {tools.length} {tools.length === 1 ? "tool" : "tools"} total
          </span>
        </div>

        {/* Tool category cards */}
        <div className="w-fit flex flex-row gap-[var(--lg)]">
          <ToolCard
            icon={<Webhook className="size-6" />}
            label="Webhook"
            count={webhookCount}
            badgeVariant="blue"
            onClick={() => setWebhookOpen(true)}
          />
          <ToolCard
            icon={<Shapes className="size-6" />}
            label="Integration"
            count={integrationCount}
            badgeVariant="green"
            onClick={() => router.push("/integrations")}
          />
        </div>
      </div>

      <Separator />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-[480px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tool"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-colors">
                {DATE_LABELS[dateSort]}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDateSort("newest")}>
                Newest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateSort("oldest")}>
                Oldest first
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-colors">
                {TYPE_LABELS[typeFilter]}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTypeFilter("all")}>
                All types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("webhook")}>
                Webhook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("integration")}>
                Integration
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content: empty state or table */}
      {filteredTools.length === 0 ? (
        <Empty className="border border-dashed border-border rounded-xl py-16">
          <EmptyHeader>
            <EmptyTitle className="text-base font-medium text-foreground">
              {search || typeFilter !== "all"
                ? "No tools match your filters"
                : "No tools yet"}
            </EmptyTitle>
            <EmptyDescription>
              {search || typeFilter !== "all"
                ? "Try adjusting your search or filter."
                : "Tools let your superagents take real actions and connect to the apps you already use"}
            </EmptyDescription>
          </EmptyHeader>
          {!search && typeFilter === "all" && (
            <EmptyContent>
              <div className="flex gap-2">
                <Button onClick={() => setWebhookOpen(true)}>
                  <Plus className="size-4" />
                  New webhook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/integrations")}
                >
                  <Shapes className="size-4" />
                  New integration
                </Button>
              </div>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <ToolsTable
          tools={filteredTools}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <AddWebhookSheet
        open={webhookOpen}
        onOpenChange={handleSheetOpenChange}
        onAdd={handleAddTool}
        editingTool={editingTool}
        onSave={handleSaveTool}
      />
    </div>
  );
}
