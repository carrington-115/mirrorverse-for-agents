"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
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
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

export type ConversationType =
  | "Outgoing phone call"
  | "Incoming phone call"
  | "Email"
  | "WhatsApp"
  | "Live chat";
export type ConversationStatus = "Success" | "Failed" | "Pending" | "Missed";

export interface AgentConversation {
  id: string;
  agent: string;
  typeOfConversation: ConversationType;
  customerInfo: string;
  durationMins: number;
  status: ConversationStatus;
}

// ─────────────────────────────────────────
// TEST DATA
// ─────────────────────────────────────────

export const testConversations: AgentConversation[] = [
  {
    id: "1",
    agent: "Inventory inquiry agent",
    typeOfConversation: "Outgoing phone call",
    customerInfo: "+91 xxxxx xxxxx",
    durationMins: 2,
    status: "Success",
  },
  {
    id: "2",
    agent: "Inventory inquiry agent",
    typeOfConversation: "Incoming phone call",
    customerInfo: "+1 xxxxx xxxxx",
    durationMins: 4.5,
    status: "Success",
  },
  {
    id: "3",
    agent: "Support agent",
    typeOfConversation: "Email",
    customerInfo: "customer@example.com",
    durationMins: 1.2,
    status: "Pending",
  },
  {
    id: "4",
    agent: "Sales agent",
    typeOfConversation: "WhatsApp",
    customerInfo: "+44 xxxxx xxxxx",
    durationMins: 8.3,
    status: "Success",
  },
  {
    id: "5",
    agent: "Billing agent",
    typeOfConversation: "Outgoing phone call",
    customerInfo: "+91 xxxxx xxxxx",
    durationMins: 3.1,
    status: "Failed",
  },
  {
    id: "6",
    agent: "Onboarding agent",
    typeOfConversation: "Live chat",
    customerInfo: "user@company.io",
    durationMins: 12.5,
    status: "Success",
  },
  {
    id: "7",
    agent: "Support agent",
    typeOfConversation: "Incoming phone call",
    customerInfo: "+1 xxxxx xxxxx",
    durationMins: 0.8,
    status: "Missed",
  },
  {
    id: "8",
    agent: "Sales agent",
    typeOfConversation: "Outgoing phone call",
    customerInfo: "+61 xxxxx xxxxx",
    durationMins: 5.0,
    status: "Success",
  },
];

// ─────────────────────────────────────────
// SUB-COMPONENT: Conversation Type Badge
// ─────────────────────────────────────────

const CONVERSATION_TYPE_STYLES: Record<ConversationType, string> = {
  "Outgoing phone call": "bg-blue-500 text-white hover:bg-blue-500",
  "Incoming phone call": "bg-purple-500 text-white hover:bg-purple-500",
  Email: "bg-orange-500 text-white hover:bg-orange-500",
  WhatsApp: "bg-green-600 text-white hover:bg-green-600",
  "Live chat": "bg-cyan-500 text-white hover:bg-cyan-500",
};

function ConversationTypeBadge({ type }: { type: ConversationType }) {
  return (
    <Badge
      className={cn(
        "rounded-full font-normal text-xs px-3 py-1 border-0",
        CONVERSATION_TYPE_STYLES[type],
      )}
    >
      {type}
    </Badge>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Status Badge
// ─────────────────────────────────────────

const STATUS_STYLES: Record<ConversationStatus, string> = {
  Success: "bg-green-500 text-white hover:bg-green-500",
  Failed: "bg-red-500 text-white hover:bg-red-500",
  Pending: "bg-yellow-500 text-white hover:bg-yellow-500",
  Missed: "bg-gray-400 text-white hover:bg-gray-400",
};

function StatusBadge({ status }: { status: ConversationStatus }) {
  return (
    <Badge
      className={cn(
        "rounded-full font-normal text-xs px-3 py-1 border-0",
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

function RowActions({ row }: { row: AgentConversation }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-sm font-normal cursor-pointer"
        >
          More
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>View details</DropdownMenuItem>
        <DropdownMenuItem>View transcript</DropdownMenuItem>
        <DropdownMenuItem>Download recording</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-500 focus:text-red-500">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────
// COLUMN DEFINITIONS
// ─────────────────────────────────────────

export const columns: ColumnDef<AgentConversation>[] = [
  // Drag handle — decorative for now
  {
    id: "drag",
    enableHiding: false,
    cell: () => (
      <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
    ),
    size: 20,
  },
  // Checkbox
  {
    id: "select",
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    size: 32,
  },
  // Agent
  {
    accessorKey: "agent",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 font-medium text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Agent
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-normal">{row.getValue("agent")}</span>
    ),
  },
  // Type of conversation
  {
    accessorKey: "typeOfConversation",
    header: () => (
      <span className="text-xs font-medium text-muted-foreground">
        Type of conversation
      </span>
    ),
    cell: ({ row }) => (
      <ConversationTypeBadge type={row.getValue("typeOfConversation")} />
    ),
  },
  // Customer info
  {
    accessorKey: "customerInfo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 font-medium text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Customer info
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-normal text-muted-foreground">
        {row.getValue("customerInfo")}
      </span>
    ),
  },
  // Duration
  {
    accessorKey: "durationMins",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 font-medium text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        duration (mins)
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-normal">
        {row.getValue("durationMins")}
      </span>
    ),
  },
  // Status
  {
    accessorKey: "status",
    header: () => (
      <span className="text-xs font-medium text-muted-foreground">Status</span>
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  // Actions
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
// SUB-COMPONENT: Table Toolbar
// ─────────────────────────────────────────

interface TableToolbarProps {
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  table: ReturnType<typeof useReactTable<AgentConversation>>;
}

function TableToolbar({
  globalFilter,
  onGlobalFilterChange,
  table,
}: TableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Search */}
      <div className="relative max-w-[460px] w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter agent, customer"
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Column visibility */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 cursor-pointer"
          >
            Select columns
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {table
            .getAllColumns()
            .filter((col) => col.getCanHide())
            .map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                className="capitalize text-sm"
                checked={col.getIsVisible()}
                onCheckedChange={(value) => col.toggleVisibility(!!value)}
              >
                {col.id === "typeOfConversation"
                  ? "Type of conversation"
                  : col.id === "customerInfo"
                    ? "Customer info"
                    : col.id === "durationMins"
                      ? "Duration (mins)"
                      : col.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT: AgentConversationsTable
// ─────────────────────────────────────────

interface AgentConversationsTableProps {
  data?: AgentConversation[];
}

export default function AgentConversationsTable({
  data = testConversations,
}: AgentConversationsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      <TableToolbar
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        table={table}
      />

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b border-border"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="h-10 bg-transparent"
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
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No conversations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Row selection count */}
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
//
// Default with test data:
//   <AgentConversationsTable />
//
// With your own data:
//   <AgentConversationsTable data={myConversations} />
