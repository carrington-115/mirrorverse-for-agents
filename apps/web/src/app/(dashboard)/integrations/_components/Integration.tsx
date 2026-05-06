"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Shapes, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Integration, IntegrationCategory } from "@/lib/types";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CATEGORIES, INTEGRATIONS } from "@/lib/data";

interface CategorySidebarProps {
  categories: IntegrationCategory[];
  selected: IntegrationCategory;
  onSelect: (cat: IntegrationCategory) => void;
}

export function CategorySidebar({
  categories,
  selected,
  onSelect,
}: CategorySidebarProps) {
  return (
    <nav className="flex flex-col gap-0.5">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={cn(
            "w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors cursor-pointer",
            selected === cat
              ? "bg-muted font-medium text-foreground"
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

export function IntegrationCard({
  integration,
  onAddIntegration,
  onViewDetails,
}: {
  integration: Integration;
  onAddIntegration: (i: Integration) => void;
  onViewDetails: (i: Integration) => void;
}) {
  const Icon = integration.icon;

  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-sm cursor-pointer">
      <div className="flex flex-col gap-1.5">
        <Icon className={cn("size-6", integration.iconColor)} />
        <h3 className="text-md font-semibold text-foreground">
          {integration.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {integration.description}
        </p>
      </div>

      <div className="flex gap-2 w-full justify-between">
        <Button
          size="sm"
          className="cursor-pointer w-1/2 text-xs"
          onClick={() => onAddIntegration(integration)}
        >
          Add integration
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer w-1/2 text-xs"
          onClick={() => onViewDetails(integration)}
        >
          View details
        </Button>
      </div>
    </div>
  );
}

interface IntegrationGridProps {
  integrations: Integration[];
  onAddIntegration: (i: Integration) => void;
  onViewDetails: (i: Integration) => void;
}

export function IntegrationGrid({
  integrations,
  onAddIntegration,
  onViewDetails,
}: IntegrationGridProps) {
  if (!integrations.length) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
        No integrations match your search.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onAddIntegration={onAddIntegration}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

export function AddIntegrationSheet({
  open,
  onOpenChange,
  integration,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: Integration | null;
}) {
  const [credentialType, setCredentialType] = useState("bot-oauth-id");
  const [credentialValue, setCredentialValue] = useState("");

  if (!integration) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Add integration</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="credentials" className="px-4">
          <TabsList variant="line">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Select a credential to use for this integration.
            </p>
            <div className="flex flex-col gap-2">
              <Select value={credentialType} onValueChange={setCredentialType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bot-oauth-id">Bot OAuth ID</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="access-token">Access Token</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Bot OAuth ID</Label>
              <Input
                placeholder="Enter credential value"
                value={credentialValue}
                onChange={(e) => setCredentialValue(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="tools" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Configure tools for {integration.name}.
            </p>
          </TabsContent>

          <TabsContent value="about" className="mt-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <integration.icon
                  className={cn("size-8", integration.iconColor)}
                />
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-xs text-muted-foreground">Integration</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {integration.description}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-auto p-4">
          <Button className="w-full cursor-pointer">Add Integration</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ManageIntegrationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageIntegrationsDialog({
  open,
  onOpenChange,
}: ManageIntegrationsDialogProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<IntegrationCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);

  const filteredIntegrations = INTEGRATIONS.filter((i) => {
    const matchesCategory =
      selectedCategory === "All" || i.category.includes(selectedCategory);
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

  const categoryLabel =
    selectedCategory === "All" ? "All integrations" : selectedCategory;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw] !w-[80vw] p-0 gap-0 overflow-hidden">
          <div className="flex h-[640px]">
            <aside className="w-44 shrink-0 border-r border-border p-4 overflow-y-auto">
              <CategorySidebar
                categories={CATEGORIES}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">
                  {categoryLabel}
                </h2>
                <div className="flex items-center gap-3">
                  <IntegrationSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by name or category"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <IntegrationGrid
                  integrations={filteredIntegrations}
                  onAddIntegration={handleAddIntegration}
                  onViewDetails={handleViewDetails}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddIntegrationSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        integration={selectedIntegration}
      />
    </>
  );
}

export function IntegrationsEmpty({
  onManageIntegrations,
}: {
  onManageIntegrations: () => void;
}) {
  return (
    <Empty className="w-[80%] border py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Shapes />
        </EmptyMedia>
        <EmptyTitle>No integrations yet</EmptyTitle>
        <EmptyDescription>
          No integrations added yet — connect your favorite tools like
          Salesforce, HubSpot, Slack, or Google Workspace to unlock seamless
          data sync and powerful agent actions across your workflows.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button onClick={onManageIntegrations} className="cursor-pointer">
            <Shapes className="size-4" />
            Add integration
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onManageIntegrations}
          >
            Manage integrations
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}

export default function IntegrationPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<IntegrationCategory>("All");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredIntegrations = INTEGRATIONS.filter((i) => {
    const matchesCategory =
      selectedCategory === "All" || i.category.includes(selectedCategory);
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
    <div className="flex flex-col w-full gap-6">
      <div className="w-full flex justify-center">
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
      <div className="w-full flex items-center flex-col gap-6">
        <IntegrationsEmpty
          onManageIntegrations={() => {
            setDialogOpen(true);
          }}
        />

        <div className="flex w-full flex-col gap-4">
          <h2 className="text-md font-medium text-muted-foreground">
            Suggested
          </h2>

          <div className="w-full grid grid-cols-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
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

      <ManageIntegrationsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
