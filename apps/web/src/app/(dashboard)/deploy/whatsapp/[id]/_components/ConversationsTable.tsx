"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ChevronDown, ArrowUpDown, GripVertical } from "lucide-react";

export type WhatsAppConversation = {
  id: string;
  contact: string;
  timestamp: Date;
  agentAssigned: string;
  messageCount: number;
  duration: string;
  status: "Resolved" | "Ongoing" | "Escalated" | "Dropped";
};

const STATUS_STYLES: Record<WhatsAppConversation["status"], string> = {
  Resolved: "bg-green-600",
  Ongoing: "bg-blue-500",
  Escalated: "bg-purple-600",
  Dropped: "bg-red-600",
};

const DATE_OPTIONS = ["All time", "Today", "This week", "This month"];
const AGENT_OPTIONS = [
  "All agents",
  "Sales Superagent",
  "Support Superagent",
  "Billing Superagent",
];

const columns: ColumnDef<WhatsAppConversation>[] = [
  {
    id: "drag",
    header: () => null,
    cell: () => (
      <GripVertical className="size-4 text-muted-foreground cursor-grab" />
    ),
    enableSorting: false,
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
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
    enableSorting: false,
  },
  {
    accessorKey: "contact",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-medium text-sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Contact
        <ArrowUpDown className="size-3.5 opacity-50" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-mono">{row.getValue("contact")}</span>
    ),
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-medium text-sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Timestamp
        <ArrowUpDown className="size-3.5 opacity-50" />
      </button>
    ),
    cell: ({ row }) => {
      const d: Date = row.getValue("timestamp");
      return (
        <div className="flex flex-col">
          <span className="text-sm text-foreground">
            {d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-xs text-muted-foreground">
            {d.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "agentAssigned",
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-medium text-sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Agent assigned
        <ArrowUpDown className="size-3.5 opacity-50" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue("agentAssigned")}</span>
    ),
  },
  {
    id: "conversationLength",
    header: "Conversation length",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm text-foreground">
          {row.original.messageCount} messages
        </span>
        <span className="text-xs text-muted-foreground">
          {row.original.duration}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status / outcome",
    cell: ({ row }) => {
      const status = row.getValue<WhatsAppConversation["status"]>("status");
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium text-white ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
      );
    },
  },
];

interface ConversationsTableProps {
  data: WhatsAppConversation[];
}

export default function ConversationsTable({ data }: ConversationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [contactSearch, setContactSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All time");
  const [agentFilter, setAgentFilter] = useState("All agents");

  const filtered = useMemo(() => {
    const now = new Date();
    return data.filter((row) => {
      const matchesContact = row.contact
        .toLowerCase()
        .includes(contactSearch.toLowerCase());

      const matchesAgent =
        agentFilter === "All agents" || row.agentAssigned === agentFilter;

      let matchesDate = true;
      if (dateFilter === "Today") {
        matchesDate = row.timestamp.toDateString() === now.toDateString();
      } else if (dateFilter === "This week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        matchesDate = row.timestamp >= startOfWeek;
      } else if (dateFilter === "This month") {
        matchesDate =
          row.timestamp.getMonth() === now.getMonth() &&
          row.timestamp.getFullYear() === now.getFullYear();
      }

      return matchesContact && matchesAgent && matchesDate;
    });
  }, [data, contactSearch, agentFilter, dateFilter]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const { pageIndex } = table.getState().pagination;
  const totalPages = table.getPageCount();
  const isEmpty = table.getRowModel().rows.length === 0;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-[596px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search WhatsApp number"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                Filter by date
                {dateFilter !== "All time" && (
                  <span className="text-xs font-semibold text-primary">
                    : {dateFilter}
                  </span>
                )}
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {DATE_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt} onClick={() => setDateFilter(opt)}>
                  {opt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                Filter by Agent
                {agentFilter !== "All agents" && (
                  <span className="text-xs font-semibold text-primary">
                    : {agentFilter}
                  </span>
                )}
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {AGENT_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt} onClick={() => setAgentFilter(opt)}>
                  {opt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table or empty state */}
      <div className="rounded-lg border border-border overflow-hidden">
        {isEmpty ? (
          <div className="flex items-center justify-center min-h-[480px]">
            <div className="border rounded-xl p-8 flex flex-col gap-3 items-center text-center w-[448px]">
              <p className="text-base font-medium text-foreground">
                No WhatsApp Conversations Yet
              </p>
              <p className="text-sm text-muted-foreground">
                This WhatsApp number hasn&apos;t handled any messages. Once
                your agent is assigned and starts replying, all customer chats
                will appear here with full history, timestamps, outcomes, and
                quick access to transcripts.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
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
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1.5 text-sm">
          <Button variant="outline" size="sm" className="size-9 px-0 font-medium">
            {pageIndex + 1}
          </Button>
          <span className="text-muted-foreground font-medium">
            of {totalPages || 1}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
