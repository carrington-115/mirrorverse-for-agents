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
import { ArrowUpDown, GripVertical, MoreHorizontal, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenuSeparator,
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
  onReset,
  onViewDetails,
}: {
  integration: ConnectedIntegration;
  selected: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  onReset?: () => void;
  onViewDetails?: () => void;
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
            <DropdownMenuItem onClick={onViewDetails}>View details</DropdownMenuItem>
            <DropdownMenuItem onClick={onReset}>Reset</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onRemove}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function SkeletonRow() {
  return (
    <TableRow className="border-b border-border last:border-b-0">
      <TableCell className="w-10 px-2">
        <Skeleton className="size-4" />
      </TableCell>
      <TableCell className="w-9 px-2">
        <Skeleton className="size-[14px]" />
      </TableCell>
      <TableCell className="px-2">
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell className="px-2">
        <Skeleton className="h-4 w-14" />
      </TableCell>
      <TableCell className="px-2">
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell className="px-2">
        <div className="gap-1 flex flex-col">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </TableCell>
      <TableCell className="px-2">
        <div className="gap-1 flex flex-col">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </TableCell>
      <TableCell className="px-2">
        <Skeleton className="h-7 w-16" />
      </TableCell>
    </TableRow>
  );
}

interface IntegrationsTableProps {
  integrations: ConnectedIntegration[];
  isLoading?: boolean;
  onRemove?: (id: string) => void;
  onReset?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  onReorder?: (integrations: ConnectedIntegration[]) => void;
}

export function IntegrationsTable({
  integrations,
  isLoading = false,
  onRemove,
  onReset,
  onViewDetails,
  onReorder,
}: IntegrationsTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

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

  function handleBulkDelete() {
    setBulkDeleteOpen(true);
  }

  function handleBulkReset() {
    for (const id of selected) onReset?.(id);
    setSelected(new Set());
  }

  const selectedCount = selected.size;
  const singleSelected = selectedCount === 1 ? [...selected][0] : null;

  return (
    <div className="gap-2 flex flex-col">
      {selectedCount > 0 && (
        <div className="gap-2 px-3 py-2 flex items-center rounded-md border border-border bg-muted/40">
          <span className="text-sm shrink-0 text-muted-foreground">{selectedCount} selected</span>
          <div className="gap-1 ml-auto flex items-center">
            {singleSelected && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onViewDetails?.(singleSelected)}
              >
                View details
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleBulkReset}
            >
              <RefreshCw className="size-3" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="size-3" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setSelected(new Set())}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

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
                <TableHead className="px-2 text-sm font-medium text-foreground">
                  Last used
                </TableHead>
                <TableHead className="px-2 text-sm font-medium text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : (
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
                      onRemove={() => setPendingDeleteId(integration.id)}
                      onReset={() => onReset?.(integration.id)}
                      onViewDetails={() => onViewDetails?.(integration.id)}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete integration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {integrations.find((i) => i.id === pendingDeleteId)?.name ?? "this integration"}
              </span>
              . This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteId) onRemove?.(pendingDeleteId);
                setPendingDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} integration{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected integration{selected.size !== 1 ? "s" : ""}.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => {
                for (const id of selected) onRemove?.(id);
                setSelected(new Set());
                setBulkDeleteOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
