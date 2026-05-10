"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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
    <nav className="gap-0.5 flex flex-col">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={cn(
            "px-4 py-2 text-sm font-medium min-h-9 w-full cursor-pointer rounded-lg text-left transition-colors",
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
    <div className="gap-3 h-40 px-3 py-4 flex w-[230px] shrink-0 flex-col justify-between rounded-lg border border-border bg-card">
      <div className="gap-0.5 flex w-full flex-col">
        <p className="font-semibold text-base leading-6 w-full text-foreground">{template.name}</p>
        <p className="text-xs leading-4 line-clamp-3 w-full text-card-foreground">
          {template.description}
        </p>
      </div>
      <div className="flex w-full items-center justify-between">
        <Button size="sm" className="cursor-pointer" onClick={() => onUseTemplate(template)}>
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

        <div className="gap-5 px-4 flex flex-1 flex-col">
          <div className="gap-1.5 flex flex-col">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Category
            </p>
            <div className="gap-1.5 flex flex-wrap">
              {template.category.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-0.5 text-xs font-medium rounded-md bg-muted text-muted-foreground"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <div className="gap-1.5 flex flex-col">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Description
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{template.description}</p>
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
  const [selectedCategory, setSelectedCategory] = useState<AgentTemplateCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  const filtered = AGENT_TEMPLATES.filter((t) => {
    const matchesCategory = selectedCategory === "All" || t.category.includes(selectedCategory);
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

  const categoryLabel = selectedCategory === "All" ? "All templates" : selectedCategory;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 gap-0 w-[80vw]! max-w-[95vw]! overflow-hidden">
          <DialogTitle className="sr-only">Manage templates</DialogTitle>

          {/* Dialog header */}
          <div className="px-5 py-4 flex items-center border-b border-border">
            <h2 className="font-semibold leading-6 text-[20px] text-foreground">
              Manage templates
            </h2>
          </div>

          {/* Body */}
          <div className="flex h-[580px]">
            {/* Sidebar */}
            <aside className="w-44 p-4 shrink-0 overflow-y-auto border-r border-border">
              <TemplateCategorySidebar
                categories={TEMPLATE_CATEGORIES}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Content header */}
              <div className="px-5 py-3 flex shrink-0 items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{categoryLabel}</p>
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
              <div className="px-5 py-3 flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="py-16 text-sm flex items-center justify-center text-muted-foreground">
                    No templates match your search.
                  </div>
                ) : (
                  <div className="gap-5 flex flex-wrap">
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
