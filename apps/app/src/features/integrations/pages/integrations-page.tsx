"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useDirectoryListQuery } from "@/features/mcp-directory/api/queries";
import { DirectoryGrid } from "@/features/mcp-directory/components/directory-grid";
import type { DirectoryEntry } from "@/features/mcp-directory/api/types";
import { useDebouncedValue } from "@/features/mcp-directory/lib/use-debounced-value";
import {
  AddIntegrationSheet,
  IntegrationsEmpty,
  ManageIntegrationsDialog,
} from "@/features/integrations/components/integration";

export function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DirectoryEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 250);
  const { data, isLoading } = useDirectoryListQuery({
    search: debouncedSearch || undefined,
    limit: 24,
  });
  const entries = useMemo(() => data?.items ?? [], [data]);

  function handleSelect(entry: DirectoryEntry) {
    setSelectedEntry(entry);
    setSheetOpen(true);
  }

  return (
    <div className="gap-6 flex w-full flex-col">
      <div className="flex w-full justify-center">
        <InputGroup className="w-[60%]">
          <InputGroupInput
            placeholder="Search integrations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">{entries.length} results</InputGroupAddon>
        </InputGroup>
      </div>
      <div className="gap-6 flex w-full flex-col items-center">
        <IntegrationsEmpty onManageIntegrationsAction={() => setDialogOpen(true)} />

        <div className="gap-4 flex w-full flex-col">
          <h2 className="text-md font-medium text-muted-foreground">Suggested</h2>
          <DirectoryGrid
            entries={entries}
            loading={isLoading}
            onAdd={handleSelect}
            onViewDetails={handleSelect}
          />
        </div>
      </div>

      <AddIntegrationSheet open={sheetOpen} onOpenChange={setSheetOpen} entry={selectedEntry} />

      <ManageIntegrationsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
