"use client";

import { useMemo, useState } from "react";
import { Search, Shapes, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConnectionsQuery } from "@/features/integrations/api/queries";
import { useComposioIntegrationsQuery } from "@/features/integrations/api/queries";
import {
  ComposioIntegrationCard,
  ComposioIntegrationCardSkeleton,
  type ComposioIntegrationItem,
} from "./composio-integration-card";
import { ComposioIntegrationSheet } from "./composio-integration-sheet";

type SidebarCategory = "All";

const SIDEBAR_CATEGORIES: readonly SidebarCategory[] = ["All"];

interface ComposioIntegrationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useIntegrationsData(search: string) {
  const { data: composioIntegrations, isLoading } = useComposioIntegrationsQuery();
  const { data: connectionsData } = useConnectionsQuery();

  const connectedSlugs = useMemo(
    () =>
      new Set((connectionsData ?? []).filter((c) => c.status === "active").map((c) => c.appSlug)),
    [connectionsData],
  );

  const items = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (composioIntegrations ?? [])
      .filter((i) => !connectedSlugs.has(i.slug))
      .filter(
        (i) =>
          !term ||
          i.name.toLowerCase().includes(term) ||
          (i.description ?? "").toLowerCase().includes(term),
      );
  }, [composioIntegrations, connectedSlugs, search]);

  return { items, isLoading };
}

function IntegrationsGrid({
  items,
  isLoading,
  search,
  onViewDetails,
}: {
  items: ComposioIntegrationItem[];
  isLoading: boolean;
  search: string;
  onViewDetails: (item: ComposioIntegrationItem) => void;
}) {
  if (isLoading) {
    return (
      <div className="gap-4 sm:grid-cols-2 lg:grid-cols-3 grid grid-cols-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <ComposioIntegrationCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="py-16 text-sm text-center text-muted-foreground">
        {search ? "No integrations match your search." : "No integrations available."}
      </p>
    );
  }
  return (
    <div className="gap-4 sm:grid-cols-2 lg:grid-cols-3 grid grid-cols-1">
      {items.map((item) => (
        <ComposioIntegrationCard key={item.slug} item={item} onViewDetails={onViewDetails} />
      ))}
    </div>
  );
}

export function ComposioIntegrationsDialog({
  open,
  onOpenChange,
}: ComposioIntegrationsDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SidebarCategory>("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ComposioIntegrationItem | null>(null);
  const isMobile = useIsMobile();

  const { items, isLoading } = useIntegrationsData(search);

  function handleViewDetails(item: ComposioIntegrationItem) {
    setSelectedItem(item);
    setSheetOpen(true);
  }

  const detailSheet = (
    <ComposioIntegrationSheet open={sheetOpen} onOpenChange={setSheetOpen} item={selectedItem} />
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            className="gap-0 p-0 flex flex-col rounded-t-xl"
            style={{ height: "90dvh" }}
          >
            {/* Header — shrinks to content, stays pinned */}
            <div className="shrink-0 border-b border-border">
              <SheetHeader className="gap-3 px-4 pt-4 pb-0 border-0">
                <SheetTitle className="text-base font-semibold">Browse integrations</SheetTitle>
              </SheetHeader>
              <div className="gap-3 px-4 pb-3 flex flex-col">
                <InputGroup>
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search integrations"
                  />
                </InputGroup>
                {/* Category badges */}
                <div className="gap-2 pb-1 flex overflow-x-auto">
                  {SIDEBAR_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium shrink-0 cursor-pointer rounded-full border whitespace-nowrap transition-colors",
                        selectedCategory === cat
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground hover:bg-muted/50",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Body — fills remaining height and scrolls */}
            <div className="min-h-0 px-4 py-4 flex-1 overflow-y-auto">
              <IntegrationsGrid
                items={items}
                isLoading={isLoading}
                search={search}
                onViewDetails={handleViewDetails}
              />
            </div>
          </SheetContent>
        </Sheet>
        {detailSheet}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 gap-0 h-[640px] w-[80vw]! max-w-[95vw]! overflow-hidden">
          <div className="flex h-full overflow-hidden">
            {/* Sticky sidebar */}
            <aside className="w-52 flex shrink-0 flex-col overflow-hidden border-r border-border">
              <DialogHeader className="px-4 pt-4 pb-3 top-0 sticky z-10 shrink-0 bg-background">
                <DialogTitle className="text-base font-semibold">Browse integrations</DialogTitle>
              </DialogHeader>
              <nav className="gap-0.5 px-2 pb-2 flex flex-col overflow-y-auto">
                {SIDEBAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 text-sm w-full cursor-pointer rounded-lg text-left transition-colors",
                      selectedCategory === cat
                        ? "font-medium bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main content */}
            <div className="min-h-0 flex flex-1 flex-col overflow-hidden">
              {/* Sticky search header */}
              <div className="px-5 py-4 top-0 sticky z-10 shrink-0 border-b border-border bg-background">
                <InputGroup className="w-3/4">
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search integrations"
                  />
                </InputGroup>
              </div>

              {/* Scrollable grid */}
              <div className="px-5 py-4 min-h-0 flex-1 overflow-y-auto">
                <IntegrationsGrid
                  items={items}
                  isLoading={isLoading}
                  search={search}
                  onViewDetails={handleViewDetails}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {detailSheet}
    </>
  );
}

export function IntegrationsEmpty({
  onNewWebhookAction,
  onBrowseIntegrationsAction,
}: {
  onNewWebhookAction: () => void;
  onBrowseIntegrationsAction: () => void;
}) {
  return (
    <Empty className="py-10 w-[80%] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Shapes />
        </EmptyMedia>
        <EmptyTitle>No integrations yet</EmptyTitle>
        <EmptyDescription>
          Connect tools, MCP servers, and apps to give your agents real capabilities — Slack to
          message teammates, GitHub to ship code, your own MCPs to do anything in between.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="gap-2 flex">
          <Button onClick={onNewWebhookAction} className="cursor-pointer">
            <Webhook className="size-4" />
            New webhook
          </Button>
          <Button variant="outline" className="cursor-pointer" onClick={onBrowseIntegrationsAction}>
            <Shapes className="size-4" />
            Browse integrations
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
