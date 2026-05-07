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
import { Search, ChevronDown, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { CallLog } from "@/lib/types";

const DIRECTION_OPTIONS = ["All", "Inbound", "Outbound", "Inbound / outbound"];
const DATE_OPTIONS = ["All time", "Today", "This week", "This month"];

const columns: ColumnDef<CallLog>[] = [
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
    accessorKey: "dateTime",
    header: "Date/Time",
    cell: ({ row }) => {
      const d: Date = row.getValue("dateTime");
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
    accessorKey: "callerId",
    header: ({ column }) => (
      <button
        className="gap-1 font-medium text-sm flex items-center"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Caller ID
        <ArrowUpDown className="size-3.5" />
      </button>
    ),
    cell: ({ row }) => <span className="text-sm font-mono">{row.getValue("callerId")}</span>,
  },
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }) => <span className="text-sm">{row.getValue("direction")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status: string = row.getValue("status");
      return (
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold text-white inline-flex items-center rounded-full ${
            status === "Answered" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-sm">
            More <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => toast.info("View transcript coming soon")}>
            View transcript
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.info("Download coming soon")}>
            Download
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => toast.info("Delete coming soon")}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

interface CallLogsTableProps {
  data: CallLog[];
}

export default function CallLogsTable({ data }: CallLogsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [callerSearch, setCallerSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All time");

  const filtered = useMemo(() => {
    const now = new Date();
    return data.filter((row) => {
      const matchesCaller = row.callerId.toLowerCase().includes(callerSearch.toLowerCase());

      const matchesDirection = directionFilter === "All" || row.direction === directionFilter;

      let matchesDate = true;
      if (dateFilter === "Today") {
        matchesDate = row.dateTime.toDateString() === now.toDateString();
      } else if (dateFilter === "This week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        matchesDate = row.dateTime >= startOfWeek;
      } else if (dateFilter === "This month") {
        matchesDate =
          row.dateTime.getMonth() === now.getMonth() &&
          row.dateTime.getFullYear() === now.getFullYear();
      }

      return matchesCaller && matchesDirection && matchesDate;
    });
  }, [data, callerSearch, directionFilter, dateFilter]);

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

  const { pageIndex, pageSize: _pageSize } = table.getState().pagination;
  const totalPages = table.getPageCount();

  return (
    <div className="gap-4 flex w-full flex-col">
      {/* Toolbar */}
      <div className="gap-3 flex items-center justify-between">
        <div className="relative max-w-[480px] flex-1">
          <Search className="left-3 size-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search caller"
            value={callerSearch}
            onChange={(e) => setCallerSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="gap-2 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                Filter by date
                {dateFilter !== "All time" && (
                  <span className="text-xs font-semibold text-primary">: {dateFilter}</span>
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
                Filter by direction
                {directionFilter !== "All" && (
                  <span className="text-xs font-semibold text-primary">: {directionFilter}</span>
                )}
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {DIRECTION_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt} onClick={() => setDirectionFilter(opt)}>
                  {opt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-sm text-center text-muted-foreground"
                >
                  No calls match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
        <span className="text-sm text-muted-foreground">
          {pageIndex + 1} of {totalPages || 1}
        </span>
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
