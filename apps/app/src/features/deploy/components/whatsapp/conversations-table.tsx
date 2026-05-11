"use client";

import { useState, useMemo } from "react";
import {
  type ColumnDef,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ChevronDown, ArrowUpDown, GripVertical, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

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
    cell: () => null,
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
        className="gap-1 font-medium text-sm flex items-center"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Contact
        <ArrowUpDown className="size-3.5 opacity-50" />
      </button>
    ),
    cell: ({ row }) => <span className="text-sm font-mono">{row.getValue("contact")}</span>,
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <button
        className="gap-1 font-medium text-sm flex items-center"
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
        className="gap-1 font-medium text-sm flex items-center"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Agent assigned
        <ArrowUpDown className="size-3.5 opacity-50" />
      </button>
    ),
    cell: ({ row }) => <span className="text-sm">{row.getValue("agentAssigned")}</span>,
  },
  {
    id: "conversationLength",
    header: "Conversation length",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm text-foreground">{row.original.messageCount} messages</span>
        <span className="text-xs text-muted-foreground">{row.original.duration}</span>
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
          className={`px-2 py-0.5 text-xs font-medium text-white inline-flex items-center rounded-lg ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-sm">
            More <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => toast.info(`View conversation with ${row.original.contact}`)}
          >
            View conversation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.info("Export coming soon")}>
            Export
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => toast.info("Delete coming soon")}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];

function SortableConversationRow({ row }: { row: Row<WhatsAppConversation> }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      data-state={row.getIsSelected() ? "selected" : undefined}
    >
      {row.getVisibleCells().map((cell) => {
        if (cell.column.id === "drag") {
          return (
            <TableCell key={cell.id} className="w-8 px-2">
              <span
                {...attributes}
                {...listeners}
                className="flex cursor-grab items-center active:cursor-grabbing"
                aria-label="Drag to reorder"
              >
                <GripVertical className="size-4 text-muted-foreground" />
              </span>
            </TableCell>
          );
        }
        return (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

interface ConversationsTableProps {
  data: WhatsAppConversation[];
}

export function ConversationsTable({ data }: ConversationsTableProps) {
  const [localData, setLocalData] = useState(data);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [contactSearch, setContactSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All time");
  const [agentFilter, setAgentFilter] = useState("All agents");

  const filtered = useMemo(() => {
    const now = new Date();
    return localData.filter((row) => {
      const matchesContact = row.contact.toLowerCase().includes(contactSearch.toLowerCase());

      const matchesAgent = agentFilter === "All agents" || row.agentAssigned === agentFilter;

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
  }, [localData, contactSearch, agentFilter, dateFilter]);

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
    getRowId: (row) => row.id,
  });

  const { pageIndex } = table.getState().pagination;
  const totalPages = table.getPageCount();
  const isEmpty = table.getRowModel().rows.length === 0;
  const visibleRowIds = table.getRowModel().rows.map((r) => r.original.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = visibleRowIds.indexOf(activeId);
    const newIndex = visibleRowIds.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedVisible = arrayMove(
      table.getRowModel().rows.map((r) => r.original),
      oldIndex,
      newIndex,
    );

    setLocalData((prev) => {
      const reorderedIdSet = new Set(reorderedVisible.map((i) => i.id));
      const filteredIndices = prev
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => reorderedIdSet.has(item.id))
        .map(({ idx }) => idx);
      const next = [...prev];
      reorderedVisible.forEach((item, i) => {
        next[filteredIndices[i]] = item;
      });
      return next;
    });
  }

  return (
    <div className="gap-4 flex w-full flex-col">
      <div className="gap-3 flex items-center justify-between">
        <div className="relative max-w-[596px] flex-1">
          <Search className="left-3 size-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search WhatsApp number"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
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
                Filter by Agent
                {agentFilter !== "All agents" && (
                  <span className="text-xs font-semibold text-primary">: {agentFilter}</span>
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

      <div className="overflow-hidden rounded-lg border border-border">
        {isEmpty ? (
          <div className="flex min-h-[480px] items-center justify-center">
            <div className="p-8 gap-3 flex w-[448px] flex-col items-center rounded-xl border text-center">
              <p className="text-base font-medium text-foreground">No WhatsApp Conversations Yet</p>
              <p className="text-sm text-muted-foreground">
                This WhatsApp number hasn&apos;t handled any messages. Once your agent is assigned
                and starts replying, all customer chats will appear here with full history,
                timestamps, outcomes, and quick access to transcripts.
              </p>
            </div>
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                <SortableContext items={visibleRowIds} strategy={verticalListSortingStrategy}>
                  {table.getRowModel().rows.map((row) => (
                    <SortableConversationRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <div className="gap-1.5 text-sm flex items-center">
          <Button variant="outline" size="sm" className="size-9 px-0 font-medium">
            {pageIndex + 1}
          </Button>
          <span className="font-medium text-muted-foreground">of {totalPages || 1}</span>
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
