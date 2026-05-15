"use client";

import { useState } from "react";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUpDown, GripVertical, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type IntegrationType = "MCP" | "Webhook" | "OAuth";
export type IntegrationStatus = "connected" | "disconnected";

export type ConnectedIntegration = {
  id: string;
  name: string;
  type: IntegrationType;
  status: IntegrationStatus;
  dateCreated: string;
  lastUsed: string;
};

type SortField = "name" | "type" | null;
type SortDir = "asc" | "desc";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function SortableIntegrationRow({
  integration,
  selected,
  onToggle,
  onRemove,
}: {
  integration: ConnectedIntegration;
  selected: boolean;
  onToggle: () => void;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: integration.id,
  });

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
    >
      <TableCell className="w-10 px-2">
        <span
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4 text-muted-foreground/50" />
        </span>
      </TableCell>
      <TableCell className="w-9 px-2" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          className="size-[14px]"
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Select ${integration.name}`}
        />
      </TableCell>
      <TableCell className="px-2">
        <span className="text-sm underline">{integration.name}</span>
      </TableCell>
      <TableCell className="px-2">
        <span className="text-sm text-foreground">{integration.type}</span>
      </TableCell>
      <TableCell className="px-2">
        <Badge
          className={`text-white rounded-full border-transparent ${
            integration.status === "connected" ? "bg-green-600" : "bg-neutral-400"
          }`}
        >
          {integration.status === "connected" ? "Connected" : "Disconnected"}
        </Badge>
      </TableCell>
      <TableCell className="px-2">
        <div className="flex flex-col">
          <span className="text-sm text-foreground">{formatDate(integration.dateCreated)}</span>
          <span className="text-xs text-muted-foreground">
            {formatTime(integration.dateCreated)}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-2">
        <div className="flex flex-col">
          <span className="text-sm text-foreground">{formatDate(integration.lastUsed)}</span>
          <span className="text-xs text-muted-foreground">{formatTime(integration.lastUsed)}</span>
        </div>
      </TableCell>
      <TableCell className="px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 cursor-pointer">
              <MoreHorizontal className="size-4" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onRemove}
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

interface IntegrationsTableProps {
  integrations: ConnectedIntegration[];
  onRemove?: (id: string) => void;
  onReorder?: (integrations: ConnectedIntegration[]) => void;
}

export function IntegrationsTable({ integrations, onRemove, onReorder }: IntegrationsTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function handleSort(field: "name" | "type") {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const displayed =
    sortField === null
      ? integrations
      : [...integrations].sort((a, b) => {
          const av = a[sortField].toLowerCase();
          const bv = b[sortField].toLowerCase();
          return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        });

  const allSelected = selected.size === integrations.length && integrations.length > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(integrations.map((i) => i.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displayed.findIndex((i) => i.id === active.id);
    const newIndex = displayed.findIndex((i) => i.id === over.id);
    setSortField(null);
    onReorder?.(arrayMove(displayed, oldIndex, newIndex));
  }

  return (
    <div className="w-full overflow-clip rounded-(--radius,10px) border border-border bg-background">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow className="h-9 border-b border-border bg-(--accent-0,#fafafa) hover:bg-(--accent-0,#fafafa)">
              <TableHead className="w-10 px-2" />
              <TableHead className="w-9 px-2">
                <Checkbox
                  className="size-[14px]"
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="px-2">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="gap-1.5 text-sm font-medium flex cursor-pointer items-center text-foreground hover:text-foreground/80"
                >
                  Name
                  <ArrowUpDown className="size-3.5 opacity-50" />
                </button>
              </TableHead>
              <TableHead className="px-2">
                <button
                  type="button"
                  onClick={() => handleSort("type")}
                  className="gap-1.5 text-sm font-medium flex cursor-pointer items-center text-foreground hover:text-foreground/80"
                >
                  Type
                  <ArrowUpDown className="size-3.5 opacity-50" />
                </button>
              </TableHead>
              <TableHead className="px-2 text-sm font-medium text-foreground">Status</TableHead>
              <TableHead className="px-2 text-sm font-medium text-foreground">
                Date created
              </TableHead>
              <TableHead className="px-2 text-sm font-medium text-foreground">Last used</TableHead>
              <TableHead className="px-2 text-sm font-medium text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={displayed.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {displayed.map((integration) => (
                <SortableIntegrationRow
                  key={integration.id}
                  integration={integration}
                  selected={selected.has(integration.id)}
                  onToggle={() => toggleOne(integration.id)}
                  onRemove={() => onRemove?.(integration.id)}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}
