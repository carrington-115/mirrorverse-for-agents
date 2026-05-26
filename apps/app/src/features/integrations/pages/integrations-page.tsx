"use client";

import { useMemo, useState } from "react";
import { MoreVertical, Shapes, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  ComposioIntegrationsDialog,
  IntegrationsEmpty,
} from "@/features/integrations/components/integration";
import { AddWebhookSheet } from "@/features/webhooks/components/add-webhook-sheet";
import {
  IntegrationsTable,
  type ConnectedIntegration,
} from "@/features/integrations/components/integrations-table";
import {
  IntegrationsTableToolbar,
  type DateFilter,
  type TypeFilter,
} from "@/features/integrations/components/integrations-table-toolbar";
import {
  useConnectionsQuery,
  useComposioIntegrationsQuery,
} from "@/features/integrations/api/queries";
import { useRevokeConnectionMutation } from "@/features/integrations/api/mutations";
import {
  ComposioIntegrationCard,
  ComposioIntegrationCardSkeleton,
  type ComposioIntegrationItem,
} from "@/features/integrations/components/composio-integration-card";
import { ComposioIntegrationSheet } from "@/features/integrations/components/composio-integration-sheet";

const RECOMMENDED_LIMIT = 4;

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
  const { data: connectionsData, isLoading: connectionsLoading } = useConnectionsQuery();
  const { data: composioIntegrations, isLoading: composioLoading } = useComposioIntegrationsQuery();
  const revokeConnection = useRevokeConnectionMutation();

  const liveIntegrations: ConnectedIntegration[] = useMemo(
    () => (connectionsData ?? []).filter((c) => c.status === "active").map(connectionToRow),
    [connectionsData],
  );

  const connectedSlugs = useMemo(
    () =>
      new Set((connectionsData ?? []).filter((c) => c.status === "active").map((c) => c.appSlug)),
    [connectionsData],
  );

  const composioItems = useMemo(
    () => (composioIntegrations ?? []).filter((i) => !connectedSlugs.has(i.slug)),
    [composioIntegrations, connectedSlugs],
  );

  const recommendedItems = useMemo(
    () => composioItems.slice(0, RECOMMENDED_LIMIT),
    [composioItems],
  );

  const [browseOpen, setBrowseOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [composioSheetOpen, setComposioSheetOpen] = useState(false);
  const [selectedComposioItem, setSelectedComposioItem] = useState<ComposioIntegrationItem | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

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

  function openComposioSheet(item: ComposioIntegrationItem) {
    setSelectedComposioItem(item);
    setComposioSheetOpen(true);
  }

  function handleViewDetails(id: string) {
    const connection = (connectionsData ?? []).find((c) => c.id === id);
    if (!connection) return;
    const composioItem = (composioIntegrations ?? []).find(
      (i) => i.slug.toLowerCase() === connection.appSlug.toLowerCase(),
    );
    if (composioItem) openComposioSheet(composioItem);
  }

  function handleRemove(id: string) {
    revokeConnection.mutate({ connectionId: id });
  }

  function handleReset(id: string) {
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
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl text-foreground">
            Integrations
          </h1>
          <div className="gap-3 flex items-center">
            <Button
              className="md:inline-flex hidden cursor-pointer"
              onClick={() => setBrowseOpen(true)}
            >
              <Shapes className="size-4" />
              Browse apps
            </Button>
            <Button
              variant="secondary"
              className="md:inline-flex hidden cursor-pointer"
              onClick={() => setWebhookOpen(true)}
            >
              <Webhook className="size-4" />
              Add webhook
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="md:hidden cursor-pointer"
                  aria-label="More actions"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="whitespace-nowrap"
                  onSelect={() => setBrowseOpen(true)}
                >
                  <Shapes className="size-4" />
                  Browse apps
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="whitespace-nowrap"
                  onSelect={() => setWebhookOpen(true)}
                >
                  <Webhook className="size-4" />
                  Add webhook
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Separator />
      </div>

      {/* Toolbar + table — shown while loading or when integrations exist */}
      {(connectionsLoading || hasIntegrations) && (
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
            isLoading={connectionsLoading}
            onRemove={handleRemove}
            onReset={handleReset}
            onViewDetails={handleViewDetails}
            onReorder={handleReorder}
          />
        </>
      )}

      {/* Empty state — shown when loaded with no integrations */}
      {!connectionsLoading && !hasIntegrations && (
        <div className="flex w-full items-center justify-center">
          <IntegrationsEmpty
            onNewWebhookAction={() => setWebhookOpen(true)}
            onBrowseIntegrationsAction={() => setBrowseOpen(true)}
          />
        </div>
      )}

      {/* Recommended — top 4 unconnected Composio apps */}
      {(composioLoading || recommendedItems.length > 0) && (
        <div className="gap-4 flex w-full flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Recommended</h2>
            {!composioLoading && composioItems.length > RECOMMENDED_LIMIT && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs cursor-pointer"
                onClick={() => setBrowseOpen(true)}
              >
                See all
              </Button>
            )}
          </div>
          <div className="gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid w-full grid-cols-1">
            {composioLoading
              ? Array.from({ length: RECOMMENDED_LIMIT }).map((_, i) => (
                  <ComposioIntegrationCardSkeleton key={i} />
                ))
              : recommendedItems.map((item) => (
                  <ComposioIntegrationCard
                    key={item.slug}
                    item={item}
                    onViewDetails={openComposioSheet}
                  />
                ))}
          </div>
        </div>
      )}

      <ComposioIntegrationsDialog open={browseOpen} onOpenChange={setBrowseOpen} />
      <ComposioIntegrationSheet
        open={composioSheetOpen}
        onOpenChange={setComposioSheetOpen}
        item={selectedComposioItem}
      />
      <AddWebhookSheet open={webhookOpen} onOpenChange={setWebhookOpen} />
    </div>
  );
}
