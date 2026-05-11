"use client";

import { useState, useEffect } from "react";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { ChannelStatus } from "@/lib/types";

export interface ChannelColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
}

export interface ChannelAction<T> {
  label: string;
  onClick: (row: T) => void;
  destructive?: boolean;
}

interface ChannelTableProps<T extends { id: string }> {
  rows: T[];
  columns: ChannelColumn<T>[];
  actions: ChannelAction<T>[];
  pageSize?: number;
  showDragHandle?: boolean;
  showCheckbox?: boolean;
  onReorder?: (rows: T[]) => void;
}

export function StatusBadge({ status }: { status: ChannelStatus }) {
  const variants: Record<ChannelStatus, { label: string; className: string }> = {
    active: {
      label: "Active",
      className: "bg-green-100 text-green-700 border-green-200",
    },
    inactive: {
      label: "Inactive",
      className: "bg-neutral-100 text-neutral-600 border-neutral-200",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    },
  };
  const { label, className } = variants[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export function VerificationBadge({ status }: { status: "verified" | "pending" }) {
  if (status === "verified") {
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200 font-normal"
        style={{
          fontSize: "var(--paragraph-mini-font-size)",
          lineHeight: "var(--paragraph-mini-line-height)",
        }}
      >
        Verified
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-amber-50 text-amber-600 border-amber-200 font-normal"
      style={{
        fontSize: "var(--paragraph-mini-font-size)",
        lineHeight: "var(--paragraph-mini-line-height)",
      }}
    >
      Pending
    </Badge>
  );
}

function SortableChannelRow<T extends { id: string }>({
  row,
  columns,
  actions,
  showDragHandle,
  showCheckbox,
  selected,
  onToggle,
}: {
  row: T;
  columns: ChannelColumn<T>[];
  actions: ChannelAction<T>[];
  showDragHandle: boolean;
  showCheckbox: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: !showDragHandle,
  });

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        borderColor: "var(--border-2)",
      }}
      className="border-b transition-colors last:border-b-0 hover:bg-muted/40"
    >
      {showDragHandle && (
        <TableCell className="w-8 px-2">
          <span
            {...attributes}
            {...listeners}
            className="flex cursor-grab items-center active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="size-4 text-muted-foreground/50 hover:text-muted-foreground" />
          </span>
        </TableCell>
      )}
      {showCheckbox && (
        <TableCell className="w-10 px-3">
          <Checkbox checked={selected} onCheckedChange={onToggle} aria-label="Select row" />
        </TableCell>
      )}
      {columns.map((col) => (
        <TableCell
          key={col.key}
          style={{
            fontSize: "var(--paragraph-small-font-size)",
            lineHeight: "var(--paragraph-small-line-height)",
            paddingTop: "var(--sm)",
            paddingBottom: "var(--sm)",
          }}
        >
          {col.render(row)}
        </TableCell>
      ))}
      <TableCell className="pr-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-0.5 text-muted-foreground hover:text-foreground"
              style={{ fontSize: "var(--paragraph-small-font-size)" }}
            >
              More
              <span className="tracking-widest ml-0.5">···</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action) => (
              <DropdownMenuItem
                key={action.label}
                onClick={() => action.onClick(row)}
                className={action.destructive ? "text-destructive" : ""}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function ChannelTable<T extends { id: string }>({
  rows,
  columns,
  actions,
  pageSize = 10,
  showDragHandle = false,
  showCheckbox = false,
  onReorder,
}: ChannelTableProps<T>) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sorted = sortKey
    ? [...rows].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey];
        const bVal = (b as Record<string, unknown>)[sortKey];
        const aStr = aVal instanceof Date ? aVal.getTime() : String(aVal ?? "");
        const bStr = bVal instanceof Date ? bVal.getTime() : String(bVal ?? "");
        const cmp = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      })
    : rows;

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleAll() {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((r) => r.id)));
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const allSelected = paginated.length > 0 && paginated.every((r) => selectedIds.has(r.id));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = paginated.findIndex((r) => r.id === active.id);
    const newIndex = paginated.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    if (onReorder) {
      const reorderedPage = arrayMove(paginated, oldIndex, newIndex);
      const reorderedIdSet = new Set(reorderedPage.map((r) => r.id));
      const filteredIndices = rows
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => reorderedIdSet.has(item.id))
        .map(({ idx }) => idx);
      const next = [...rows];
      reorderedPage.forEach((item, i) => {
        next[filteredIndices[i]] = item;
      });
      onReorder(next);
    }
  }

  const tableBody = (
    <TableBody>
      <SortableContext items={paginated.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        {paginated.map((row) => (
          <SortableChannelRow
            key={row.id}
            row={row}
            columns={columns}
            actions={actions}
            showDragHandle={showDragHandle}
            showCheckbox={showCheckbox}
            selected={selectedIds.has(row.id)}
            onToggle={() => toggleRow(row.id)}
          />
        ))}
      </SortableContext>
    </TableBody>
  );

  return (
    <div
      className="w-full overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--border-2)" }}
    >
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow className="border-b" style={{ borderColor: "var(--border-2)" }}>
              {showDragHandle && <TableHead className="w-8 px-2" />}
              {showCheckbox && (
                <TableHead className="w-10 px-3">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  style={{
                    fontSize: "var(--paragraph-small-font-size)",
                    lineHeight: "var(--paragraph-small-line-height)",
                    paddingTop: "var(--xs)",
                    paddingBottom: "var(--xs)",
                  }}
                >
                  {col.sortable ? (
                    <button
                      className="gap-1 flex items-center transition-colors hover:text-foreground"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.header}
                      <ArrowUpDown
                        className="size-3"
                        style={{
                          color:
                            sortKey === col.key ? "var(--foreground)" : "var(--muted-foreground)",
                        }}
                      />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          {tableBody}
        </Table>
      </DndContext>

      {totalPages > 1 && (
        <div
          className="px-4 py-2 flex items-center justify-between border-t"
          style={{
            borderColor: "var(--border-1)",
            backgroundColor: "var(--muted)",
            fontSize: "var(--paragraph-small-font-size)",
            lineHeight: "var(--paragraph-small-line-height)",
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-7"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="size-3.5" />
            Previous
          </Button>
          <span
            className="text-muted-foreground"
            style={{ fontSize: "var(--paragraph-small-font-size)" }}
          >
            {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-7"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
