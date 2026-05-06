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
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  ChevronDown,
  GripVertical,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export type AgentStatus = "Active" | "Inactive";

export interface Agent {
  id: string;
  name: string;
  memoryHitRate: number; // hits per interaction
  interactions: number;
  uptime: number; // hours
  status: AgentStatus;
}

export interface AgentsTableProps {
  data?: Agent[];
}

// ─────────────────────────────────────────
// TEST DATA
// ─────────────────────────────────────────

export const testAgents: Agent[] = [
  {
    id: "1",
    name: "Inventory inquiry agent",
    memoryHitRate: 100,
    interactions: 47,
    uptime: 2,
    status: "Active",
  },
  {
    id: "2",
    name: "Marketing agent",
    memoryHitRate: 20,
    interactions: 10,
    uptime: 4.5,
    status: "Inactive",
  },
  {
    id: "3",
    name: "Marketing agent",
    memoryHitRate: 20,
    interactions: 10,
    uptime: 4.5,
    status: "Inactive",
  },
  {
    id: "4",
    name: "Marketing agent",
    memoryHitRate: 20,
    interactions: 10,
    uptime: 4.5,
    status: "Inactive",
  },
  {
    id: "5",
    name: "Support agent",
    memoryHitRate: 88,
    interactions: 63,
    uptime: 8.0,
    status: "Active",
  },
  {
    id: "6",
    name: "Sales agent",
    memoryHitRate: 74,
    interactions: 31,
    uptime: 1.5,
    status: "Active",
  },
];

// ─────────────────────────────────────────
// SUB-COMPONENT: Status Badge
// ─────────────────────────────────────────

const STATUS_STYLES: Record<AgentStatus, string> = {
  Active: "bg-green-500 text-white hover:bg-green-500",
  Inactive: "bg-gray-400  text-white hover:bg-gray-400",
};

function StatusBadge({ status }: { status: AgentStatus }) {
  return (
    <Badge
      className={cn(
        "rounded-full border-0 px-3 py-1 text-xs font-normal",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </Badge>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Row Actions
// ─────────────────────────────────────────

function RowActions({ row }: { row: Agent }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-sm font-normal cursor-pointer"
        >
          More <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>View agent</DropdownMenuItem>
        <DropdownMenuItem>Edit agent</DropdownMenuItem>
        <DropdownMenuItem>View logs</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-500 focus:text-red-500">
          Delete agent
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
// COLUMN DEFINITIONS
// ─────────────────────────────────────────

export const agentColumns: ColumnDef<Agent>[] = [
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
    header: ({ column }) => <SortableHeader column={column} label="Agent" />,
    cell: ({ row }) => <span className="text-sm">{row.getValue("name")}</span>,
  },
  {
    accessorKey: "memoryHitRate",
    header: ({ column }) => (
      <SortableHeader column={column} label="Memory hit rate (h/i)" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("memoryHitRate")}</span>
    ),
  },
  {
    accessorKey: "interactions",
    header: ({ column }) => (
      <SortableHeader column={column} label="interactions" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("interactions")}</span>
    ),
  },
  {
    accessorKey: "uptime",
    header: ({ column }) => <SortableHeader column={column} label="Uptime" />,
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("uptime")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: () => (
      <span className="text-xs font-medium text-muted-foreground">Status</span>
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => (
      <span className="text-xs font-medium text-muted-foreground">Actions</span>
    ),
    cell: ({ row }) => <RowActions row={row.original} />,
  },
];

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────

export default function AgentsTable({ data = testAgents }: AgentsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns: agentColumns,
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
            placeholder="Filter by agent name"
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
                  {col.id === "memoryHitRate" ? "Memory hit rate" : col.id}
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
                  colSpan={agentColumns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No agents found.
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
