"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Shapes, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTRPC } from "@/lib/trpc/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { useDirectoryListQuery } from "@/features/mcp-directory/api/queries";
import { useConnectionsQuery } from "@/features/integrations/api/queries";
import { useDebouncedValue } from "@/features/mcp-directory/lib/use-debounced-value";
import { DirectoryGrid } from "@/features/mcp-directory/components/directory-grid";
import { DirectoryIcon } from "@/features/mcp-directory/components/directory-icon";
import type { DirectoryEntry } from "@/features/mcp-directory/api/types";

interface CategorySidebarProps {
  categories: readonly string[];
  selected: string;
  onSelect: (cat: string) => void;
}

export function CategorySidebar({ categories, selected, onSelect }: CategorySidebarProps) {
  return (
    <nav className="gap-0.5 flex flex-col">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={cn(
            "px-3 py-1.5 text-sm w-full cursor-pointer rounded-lg text-left transition-colors",
            selected === cat
              ? "font-medium bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          )}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
}

interface IntegrationSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function IntegrationSearchBar({
  value,
  onChange,
  placeholder = "Search by name or category",
}: IntegrationSearchBarProps) {
  return (
    <InputGroup className="mr-10">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </InputGroup>
  );
}

interface AddIntegrationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: DirectoryEntry | null;
}

export function AddIntegrationSheet({ open, onOpenChange, entry }: AddIntegrationSheetProps) {
  const trpc = useTRPC();
  const connectMutation = useMutation(
    trpc.connections.initiateAppConnection.mutationOptions({
      onSuccess: ({ redirectUrl }) => {
        if (redirectUrl) {
          window.open(redirectUrl, "_blank", "noopener,noreferrer,width=600,height=700");
        }
        onOpenChange(false);
      },
      onError: () => {
        toast.error(
          `Could not connect ${entry?.displayName ?? "this integration"}. Please add it on your Composio dashboard.`,
        );
      },
    }),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Integration details</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="credentials" className="px-4">
          <TabsList variant="line">
            <TabsTrigger value="credentials">Connect</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="mt-4 gap-4 flex flex-col">
            <p className="text-sm text-muted-foreground">
              Authentication is handled via Composio. Click Connect below to start the OAuth flow.
            </p>
          </TabsContent>

          <TabsContent value="tools" className="mt-4 gap-2 flex flex-col">
            <p className="text-sm text-muted-foreground">
              {entry
                ? `Tools provided by ${entry.displayName}.`
                : "Select an integration to see its tools."}
            </p>
            {entry && entry.toolNames.length > 0 ? (
              <ul className="gap-1 text-sm flex flex-col text-foreground">
                {entry.toolNames.map((tool: string) => (
                  <li key={tool} className="font-mono">
                    {tool}
                  </li>
                ))}
              </ul>
            ) : null}
          </TabsContent>

          <TabsContent value="about" className="mt-4">
            {entry ? (
              <div className="gap-3 flex flex-col">
                <div className="gap-3 flex items-center">
                  <DirectoryIcon entry={entry} size={32} className="size-8" />
                  <div>
                    <p className="font-medium">{entry.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.authorName ? `by ${entry.authorName}` : "Integration"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {entry.description ?? entry.oneLiner ?? ""}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No integration selected.</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="p-4 mt-auto">
          <Button
            className="w-full cursor-pointer"
            disabled={!entry || connectMutation.isPending}
            onClick={() => {
              if (entry) connectMutation.mutate({ appSlug: entry.slug });
            }}
          >
            {connectMutation.isPending ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ManageIntegrationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CATEGORY = "All";

export function ManageIntegrationsDialog({ open, onOpenChange }: ManageIntegrationsDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_CATEGORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DirectoryEntry | null>(null);

  const debouncedSearch = useDebouncedValue(searchQuery, 250);
  const { data, isLoading } = useDirectoryListQuery({
    search: debouncedSearch || undefined,
    category: selectedCategory === DEFAULT_CATEGORY ? undefined : selectedCategory,
    limit: 60,
  });
  const { data: connectionsData } = useConnectionsQuery();
  const connectedSlugs = useMemo(
    () => new Set((connectionsData ?? []).map((c) => c.appSlug)),
    [connectionsData],
  );
  const entries = useMemo(
    () => (data?.items ?? []).filter((e) => !connectedSlugs.has(e.slug)),
    [data, connectedSlugs],
  );

  const [seenCategories, setSeenCategories] = useState<readonly string[]>([]);
  useEffect(() => {
    setSeenCategories((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const entry of entries) {
        for (const cat of entry.categories) {
          if (!next.has(cat)) {
            next.add(cat);
            changed = true;
          }
        }
      }
      return changed ? Array.from(next).sort() : prev;
    });
  }, [entries]);
  const categories = useMemo(() => [DEFAULT_CATEGORY, ...seenCategories], [seenCategories]);

  function handleSelect(entry: DirectoryEntry) {
    setSelectedEntry(entry);
    setSheetOpen(true);
  }

  const categoryLabel =
    selectedCategory === DEFAULT_CATEGORY ? "All integrations" : selectedCategory;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 gap-0 w-[80vw]! max-w-[95vw]! overflow-hidden">
          <div className="flex h-[640px]">
            <aside className="w-44 p-4 shrink-0 overflow-y-auto border-r border-border">
              <CategorySidebar
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-border">
                <h2 className="text-base font-semibold text-foreground">{categoryLabel}</h2>
                <div className="gap-3 flex items-center">
                  <IntegrationSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by name or category"
                  />
                </div>
              </div>

              <div className="px-5 py-4 flex-1 overflow-y-auto">
                <DirectoryGrid entries={entries} loading={isLoading} onViewDetails={handleSelect} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddIntegrationSheet open={sheetOpen} onOpenChange={setSheetOpen} entry={selectedEntry} />
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
