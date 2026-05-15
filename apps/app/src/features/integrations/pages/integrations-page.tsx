"use client";

import { useMemo, useState } from "react";
import { Shapes, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDirectoryListQuery } from "@/features/mcp-directory/api/queries";
import { DirectoryGrid } from "@/features/mcp-directory/components/directory-grid";
import type { DirectoryEntry } from "@/features/mcp-directory/api/types";
import {
  AddIntegrationSheet,
  IntegrationsEmpty,
  ManageIntegrationsDialog,
} from "@/features/integrations/components/integration";
import { AddWebhookDialog } from "@/features/integrations/components/add-mcp-dialog";
import {
  IntegrationsTable,
  type ConnectedIntegration,
} from "@/features/integrations/components/integrations-table";
import {
  IntegrationsTableToolbar,
  type DateFilter,
  type TypeFilter,
} from "@/features/integrations/components/integrations-table-toolbar";
import { useConnectionsQuery } from "@/features/integrations/api/queries";
import { useRevokeConnectionMutation } from "@/features/integrations/api/mutations";

function connectionToRow(c: {
  id: string;
  appSlug: string;
  displayName: string;
  status: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}): ConnectedIntegration {
  return {
    id: c.id,
    name: c.displayName || c.appSlug,
    type: "OAuth",
    status: c.status === "active" ? "connected" : "disconnected",
    dateCreated: c.createdAt.toISOString(),
    lastUsed: (c.lastUsedAt ?? c.createdAt).toISOString(),
  };
}

export function IntegrationsPage() {
  const { data: connectionsData } = useConnectionsQuery();
  const revokeConnection = useRevokeConnectionMutation();
  const liveIntegrations: ConnectedIntegration[] = useMemo(
    () => (connectionsData ?? []).map(connectionToRow),
    [connectionsData],
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DirectoryEntry | null>(null);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const { data, isLoading } = useDirectoryListQuery({ limit: 24 });
  const entries = useMemo(() => data?.items ?? [], [data]);

  const filteredIntegrations = useMemo(() => {
    return liveIntegrations.filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || i.type === typeFilter;
      const matchesDate = (() => {
        if (dateFilter === "all") return true;
        const d = new Date(i.dateCreated);
        const now = new Date();
        if (dateFilter === "today") return d.toDateString() === now.toDateString();
        if (dateFilter === "this_week") {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return d >= weekAgo;
        }
        if (dateFilter === "this_month")
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (dateFilter === "this_year") return d.getFullYear() === now.getFullYear();
        return true;
      })();
      return matchesSearch && matchesType && matchesDate;
    });
  }, [liveIntegrations, searchQuery, typeFilter, dateFilter]);

  const hasIntegrations = liveIntegrations.length > 0;

  function handleSelect(entry: DirectoryEntry) {
    setSelectedEntry(entry);
    setSheetOpen(true);
  }

  function handleRemove(id: string) {
    revokeConnection.mutate({ connectionId: id });
  }

  function handleReorder(_reordered: ConnectedIntegration[]) {
    // Order is managed server-side; local reorder is a no-op for now
  }

  return (
    <div className="gap-5 flex w-full flex-col">
      {/* Inner page header */}
      <div className="gap-5 flex flex-col">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Integrations</h1>
          <div className="gap-3 flex items-center">
            <Button className="cursor-pointer" onClick={() => setBrowseOpen(true)}>
              <Shapes className="size-4" />
              Browse apps
            </Button>
            <Button
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setWebhookOpen(true)}
            >
              <Webhook className="size-4" />
              Add webhook
            </Button>
          </div>
        </div>
        <Separator />
      </div>

      {/* Toolbar + table — shown when integrations exist */}
      {hasIntegrations && (
        <>
          <IntegrationsTableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
          />
          <IntegrationsTable
            integrations={filteredIntegrations}
            onRemove={handleRemove}
            onReorder={handleReorder}
          />
        </>
      )}

      {/* Empty state — shown when no integrations */}
      {!hasIntegrations && (
        <div className="flex w-full items-center justify-center">
          <IntegrationsEmpty
            onNewWebhookAction={() => setWebhookOpen(true)}
            onBrowseIntegrationsAction={() => setBrowseOpen(true)}
          />
        </div>
      )}

      {/* Suggested apps — always visible */}
      <div className="gap-4 flex w-full flex-col">
        <h2 className="text-sm font-medium text-muted-foreground">Suggested</h2>
        <DirectoryGrid
          entries={entries}
          loading={isLoading}
          onAdd={handleSelect}
          onViewDetails={handleSelect}
        />
      </div>

      <AddIntegrationSheet open={sheetOpen} onOpenChange={setSheetOpen} entry={selectedEntry} />
      <ManageIntegrationsDialog open={browseOpen} onOpenChange={setBrowseOpen} />
      <AddWebhookDialog open={webhookOpen} onOpenChange={setWebhookOpen} />
    </div>
  );
}
