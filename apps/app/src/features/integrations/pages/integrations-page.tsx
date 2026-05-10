"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Integration, IntegrationCategory } from "@/lib/types";
import { INTEGRATIONS } from "@/lib/data";
import {
  AddIntegrationSheet,
  IntegrationCard,
  IntegrationsEmpty,
  ManageIntegrationsDialog,
} from "@/features/integrations/components/integration";

export function IntegrationsPage() {
  const [selectedCategory, _setSelectedCategory] = useState<IntegrationCategory>("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [searchQuery, _setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredIntegrations = INTEGRATIONS.filter((i) => {
    const matchesCategory = selectedCategory === "All" || i.category.includes(selectedCategory);
    const matchesSearch =
      !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleAddIntegration(integration: Integration) {
    setSelectedIntegration(integration);
    setSheetOpen(true);
  }

  function handleViewDetails(integration: Integration) {
    setSelectedIntegration(integration);
    setSheetOpen(true);
  }

  return (
    <div className="gap-6 flex w-full flex-col">
      <div className="flex w-full justify-center">
        <InputGroup className="w-[60%]">
          <InputGroupInput placeholder="Search..." />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupAddon align="inline-end">
            {filteredIntegrations.length} results
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="gap-6 flex w-full flex-col items-center">
        <IntegrationsEmpty
          onManageIntegrations={() => {
            setDialogOpen(true);
          }}
        />

        <div className="gap-4 flex w-full flex-col">
          <h2 className="text-md font-medium text-muted-foreground">Suggested</h2>

          <div className="sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 grid w-full grid-cols-3">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onAddIntegration={handleAddIntegration}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      </div>

      <AddIntegrationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        integration={selectedIntegration}
      />

      <ManageIntegrationsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
