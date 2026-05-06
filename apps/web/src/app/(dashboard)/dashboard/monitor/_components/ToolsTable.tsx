"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpDown,
  ChevronDown,
  GripVertical,
  MoreHorizontal,
  Search,
  Wrench,
} from "lucide-react";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface Tool {
  id: string;
  name: string;
  averageUsage: string; // e.g. "120/day"
  successRate: string; // e.g. "99.2%"
  averageLatency: string; // e.g. "380ms"
}

export interface ToolsTableProps {
  data?: Tool[];
}

// ─────────────────────────────────────────
// TEST DATA
// ─────────────────────────────────────────

export const testTools: Tool[] = [
  {
    id: "1",
    name: "Salesforce update",
    averageUsage: "120/day",
    successRate: "99.2%",
    averageLatency: "380ms",
  },
  {
    id: "2",
    name: "Calendly booking",
    averageUsage: "180/day",
    successRate: "97.8%",
    averageLatency: "520ms",
  },
  {
    id: "3",
    name: "Stripe payment looku…",
    averageUsage: "95/day",
    successRate: "100%",
    averageLatency: "290ms",
  },
  {
    id: "4",
    name: "Slack notification",
    averageUsage: "450/day",
    successRate: "98.5%",
    averageLatency: "610ms",
  },
  {
    id: "5",
    name: "HubSpot sync",
    averageUsage: "75/day",
    successRate: "96.1%",
    averageLatency: "440ms",
  },
  {
    id: "6",
    name: "OpenAI completion",
    averageUsage: "320/day",
    successRate: "99.9%",
    averageLatency: "850ms",
  },
];

// ─────────────────────────────────────────
// SUB-COMPONENT: Sortable Header
// ─────────────────────────────────────────

function SortableHeader({ column, label }: { column: any; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Success Rate Cell
// Shows a subtle green tint for high success rates
// ─────────────────────────────────────────

function SuccessRateCell({ value }: { value: string }) {
  const numeric = parseFloat(value);
  const isHigh = numeric >= 99;
  return (
    <span
      className={
        isHigh
          ? "text-sm font-medium text-green-600 dark:text-green-400"
          : "text-sm"
      }
    >
      {value}
    </span>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Row Actions
// ─────────────────────────────────────────

function RowActions({ row }: { row: Tool }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>View tool</DropdownMenuItem>
        <DropdownMenuItem>View usage logs</DropdownMenuItem>
        <DropdownMenuItem>Edit configuration</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-500 focus:text-red-500">
          Remove tool
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────
// COLUMN DEFINITIONS
// ─────────────────────────────────────────

export const toolColumns: ColumnDef<Tool>[] = [
  {
    id: "drag",
    enableHiding: false,
    size: 20,
    cell: () => (
      <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
    ),
  },
  {
    id: "select",
    enableHiding: false,
    size: 32,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} label="Tool" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Wrench className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-sm truncate max-w-[160px]">
          {row.getValue("name")}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "averageUsage",
    header: ({ column }) => (
      <SortableHeader column={column} label="Average usage" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("averageUsage")}
      </span>
    ),
  },
  {
    accessorKey: "successRate",
    header: ({ column }) => (
      <SortableHeader column={column} label="Success rate" />
    ),
    cell: ({ row }) => <SuccessRateCell value={row.getValue("successRate")} />,
  },
  {
    accessorKey: "averageLatency",
    header: ({ column }) => (
      <SortableHeader column={column} label="Average latency" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("averageLatency")}
      </span>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => <RowActions row={row.original} />,
  },
];

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────

export default function ToolsTable({ data = testTools }: ToolsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns: toolColumns,
    state: { sorting, columnVisibility, rowSelection, globalFilter },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-[280px] w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by tool name"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1 cursor-pointer"
            >
              Select columns <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="text-sm capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                >
                  {col.id === "averageUsage"
                    ? "Average usage"
                    : col.id === "successRate"
                      ? "Success rate"
                      : col.id === "averageLatency"
                        ? "Average latency"
                        : col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="hover:bg-transparent border-b border-border"
              >
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="h-10"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={toolColumns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No tools found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {Object.keys(rowSelection).length > 0 && (
        <p className="text-xs text-muted-foreground">
          {Object.keys(rowSelection).length} of {data.length} row(s) selected
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// USAGE
// ─────────────────────────────────────────
// <ToolsTable />
// <ToolsTable data={myTools} />
