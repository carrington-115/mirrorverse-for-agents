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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  GripVertical,
} from "lucide-react";
import type { ChannelStatus } from "@/lib/types";

export interface ChannelColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  /** Hide this column in the mobile list view. */
  mobileHide?: boolean;
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
  /** Label shown in the mobile list header. */
  title?: string;
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

// ─── Desktop sortable row ─────────────────────────────────────────────────────

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
      }}
      className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
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
        <TableCell className="w-10 px-3" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            className="size-[14px]"
            checked={selected}
            onCheckedChange={onToggle}
            aria-label="Select row"
          />
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

// ─── Shared pagination row ────────────────────────────────────────────────────

function PaginationRow({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="px-4 py-2 flex items-center justify-between border-t border-border">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 h-7"
        onClick={onPrev}
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
        onClick={onNext}
        disabled={page === totalPages}
      >
        Next
        <ChevronRight className="size-3.5" />
      </Button>
    </div>
  );
}

// ─── Main table component ─────────────────────────────────────────────────────

export function ChannelTable<T extends { id: string }>({
  rows,
  columns,
  actions,
  title = "Items",
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
    if (allSelected) {
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

  // Mobile helpers
  const mobileColumns = columns.filter((c) => !c.mobileHide);
  const [primaryMobileCol, ...secondaryMobileCols] =
    mobileColumns.length > 0 ? mobileColumns : columns;
  const firstSortableKey = columns.find((c) => c.sortable)?.key ?? null;
  const MobileSortIcon =
    sortKey === firstSortableKey && firstSortableKey !== null
      ? sortDir === "asc"
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown;

  return (
    <div className="flex flex-col">
      {/* ── Desktop table (md and up) ────────────────────────────────────── */}
      <div className="md:block hidden w-full overflow-clip rounded-(--radius,10px) border border-border bg-background">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow className="h-9 border-b border-border bg-(--accent-0,#fafafa) hover:bg-(--accent-0,#fafafa)">
                {showDragHandle && <TableHead className="w-8 px-2" />}
                {showCheckbox && (
                  <TableHead className="w-10 px-3">
                    <Checkbox
                      className="size-[14px]"
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
            <TableBody>
              <SortableContext
                items={paginated.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
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
          </Table>
        </DndContext>

        {totalPages > 1 && (
          <PaginationRow
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        )}
      </div>

      {/* ── Mobile list (below md) ────────────────────────────────────────── */}
      <div className="md:hidden w-full overflow-hidden rounded-(--radius,10px) border border-border bg-background">
        {/* Mobile header */}
        <div className="h-9 flex w-full items-center border-b border-border bg-(--accent-0,#fafafa)">
          {showCheckbox && (
            <div
              className="flex w-[42px] shrink-0 items-center justify-center px-(--xs,8px) py-[10px]"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                className="size-[14px]"
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </div>
          )}
          <button
            type="button"
            className="flex flex-1 items-center gap-(--xs,8px) px-(--xs,8px) py-[8px] text-left"
            onClick={() => firstSortableKey && toggleSort(firstSortableKey)}
            disabled={!firstSortableKey}
          >
            <span className="text-sm font-medium leading-5 text-foreground">{title}</span>
            {firstSortableKey && <MobileSortIcon className="size-4 shrink-0 opacity-50" />}
          </button>
        </div>

        {/* Mobile rows */}
        {paginated.map((row) => (
          <div
            key={row.id}
            className="gap-3 px-4 py-3 flex items-start border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
          >
            {showCheckbox && (
              <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  className="size-[14px]"
                  checked={selectedIds.has(row.id)}
                  onCheckedChange={() => toggleRow(row.id)}
                  aria-label="Select row"
                />
              </div>
            )}
            <div className="min-w-0 gap-1 flex flex-1 flex-col">
              {/* Primary column */}
              <div className="text-sm font-medium">{primaryMobileCol.render(row)}</div>
              {/* Secondary columns */}
              <div className="gap-x-2 gap-y-0.5 flex flex-wrap items-center">
                {secondaryMobileCols.map((col) => (
                  <div key={col.key} className="text-xs">
                    {col.render(row)}
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="size-8 flex items-center justify-center rounded-lg transition-colors hover:bg-muted/50"
                    title="More options"
                  >
                    <Ellipsis className="size-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
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
            </div>
          </div>
        ))}

        {totalPages > 1 && (
          <PaginationRow
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        )}
      </div>
    </div>
  );
}
