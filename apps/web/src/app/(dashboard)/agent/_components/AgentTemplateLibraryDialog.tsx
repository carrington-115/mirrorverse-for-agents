"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AgentTemplate, AgentTemplateCategory } from "@/lib/types";
import { AGENT_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/data";
import { toast } from "sonner";

function TemplateCategorySidebar({
  categories,
  selected,
  onSelect,
}: {
  categories: AgentTemplateCategory[];
  selected: AgentTemplateCategory;
  onSelect: (cat: AgentTemplateCategory) => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={cn(
            "w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors cursor-pointer min-h-9",
            selected === cat
              ? "bg-muted text-foreground"
              : "text-[var(--ghost-foreground)] hover:bg-muted/50 hover:text-foreground",
          )}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
}

function DialogTemplateCard({
  template,
  onUseTemplate,
  onViewDetails,
}: {
  template: AgentTemplate;
  onUseTemplate: (t: AgentTemplate) => void;
  onViewDetails: (t: AgentTemplate) => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card h-40 px-3 py-4 shrink-0 w-[230px]">
      <div className="flex flex-col gap-0.5 w-full">
        <p className="font-semibold text-base leading-6 text-foreground w-full">
          {template.name}
        </p>
        <p className="text-xs leading-4 text-card-foreground line-clamp-3 w-full">
          {template.description}
        </p>
      </div>
      <div className="flex items-center justify-between w-full">
        <Button
          size="sm"
          className="cursor-pointer"
          onClick={() => onUseTemplate(template)}
        >
          Use template
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer"
          onClick={() => onViewDetails(template)}
        >
          View details
        </Button>
      </div>
    </div>
  );
}

export function TemplateDetailSheet({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AgentTemplate | null;
}) {
  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-sm flex flex-col">
        <SheetHeader>
          <SheetTitle>{template.name}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 flex-1">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Category
            </p>
            <div className="flex flex-wrap gap-1.5">
              {template.category.map((cat) => (
                <span
                  key={cat}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {template.description}
            </p>
          </div>
        </div>

        <div className="p-4 mt-auto">
          <Button
            className="w-full cursor-pointer"
            onClick={() => {
              toast.info(`Using "${template.name}" — coming soon`);
            }}
          >
            Use template
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface AgentTemplateLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentTemplateLibraryDialog({
  open,
  onOpenChange,
}: AgentTemplateLibraryDialogProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<AgentTemplateCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<AgentTemplate | null>(null);

  const filtered = AGENT_TEMPLATES.filter((t) => {
    const matchesCategory =
      selectedCategory === "All" || t.category.includes(selectedCategory);
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function handleUseTemplate(template: AgentTemplate) {
    toast.info(`Using "${template.name}" — coming soon`);
  }

  function handleViewDetails(template: AgentTemplate) {
    setSelectedTemplate(template);
    setSheetOpen(true);
  }

  const categoryLabel =
    selectedCategory === "All" ? "All templates" : selectedCategory;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw] !w-[80vw] p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Manage templates</DialogTitle>

          {/* Dialog header */}
          <div className="flex items-center border-b border-border px-5 py-4">
            <h2 className="text-[20px] font-semibold leading-6 text-foreground">
              Manage templates
            </h2>
          </div>

          {/* Body */}
          <div className="flex h-[580px]">
            {/* Sidebar */}
            <aside className="w-44 shrink-0 border-r border-border p-4 overflow-y-auto">
              <TemplateCategorySidebar
                categories={TEMPLATE_CATEGORIES}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Content header */}
              <div className="flex items-center justify-between px-5 py-3 shrink-0">
                <p className="text-sm font-semibold text-foreground">
                  {categoryLabel}
                </p>
                <InputGroup className="w-[320px]">
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or category"
                  />
                </InputGroup>
              </div>

              {/* Template grid */}
              <div className="flex-1 overflow-y-auto px-5 py-3">
                {filtered.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                    No templates match your search.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-5">
                    {filtered.map((template) => (
                      <DialogTemplateCard
                        key={template.id}
                        template={template}
                        onUseTemplate={handleUseTemplate}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TemplateDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        template={selectedTemplate}
      />
    </>
  );
}
