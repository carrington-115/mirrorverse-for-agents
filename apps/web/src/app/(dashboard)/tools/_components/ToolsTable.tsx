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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Webhook,
  Shapes,
} from "lucide-react";
import {
  SiSlack,
  SiStripe,
  SiCalendly,
  SiNotion,
  SiSalesforce,
  SiZapier,
  SiHubspot,
  SiGoogleanalytics,
} from "react-icons/si";
import { cn } from "@/lib/utils";
import { Tool } from "@/lib/types";

// ─── Icon map ────────────────────────────────────────────────────────────────

interface IconConfig {
  element: React.ReactNode;
  bg: string;
}

const ICON_MAP: Record<string, IconConfig> = {
  webhook: {
    element: <Webhook className="size-4" />,
    bg: "bg-blue-100 text-blue-600",
  },
  slack: {
    element: <SiSlack className="size-4" />,
    bg: "bg-[#4A154B]/10 text-[#4A154B]",
  },
  stripe: {
    element: <SiStripe className="size-4" />,
    bg: "bg-[#635BFF]/10 text-[#635BFF]",
  },
  calendly: {
    element: <SiCalendly className="size-4" />,
    bg: "bg-[#006BFF]/10 text-[#006BFF]",
  },
  notion: {
    element: <SiNotion className="size-4" />,
    bg: "bg-neutral-100 text-neutral-800",
  },
  salesforce: {
    element: <SiSalesforce className="size-4" />,
    bg: "bg-[#00A1E0]/10 text-[#00A1E0]",
  },
  zapier: {
    element: <SiZapier className="size-4" />,
    bg: "bg-[#FF4A00]/10 text-[#FF4A00]",
  },
  hubspot: {
    element: <SiHubspot className="size-4" />,
    bg: "bg-[#FF7A59]/10 text-[#FF7A59]",
  },
  analytics: {
    element: <SiGoogleanalytics className="size-4" />,
    bg: "bg-[#E37400]/10 text-[#E37400]",
  },
};

function ToolIcon({ iconKey, type }: { iconKey?: string; type: Tool["type"] }) {
  const key = iconKey ?? (type === "integration" ? "shapes" : "webhook");
  const config = ICON_MAP[key] ?? {
    element:
      type === "integration" ? (
        <Shapes className="size-4" />
      ) : (
        <Webhook className="size-4" />
      ),
    bg:
      type === "integration"
        ? "bg-green-100 text-green-600"
        : "bg-blue-100 text-blue-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg size-8 shrink-0",
        config.bg,
      )}
    >
      {config.element}
    </span>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortableHeader({ column, label }: { column: any; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-1 size-3" />
    </Button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ToolsTableProps {
  tools: Tool[];
  onEdit: (tool: Tool) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ToolsTable({
  tools,
  onEdit,
  onDelete,
  onToggleStatus,
}: ToolsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<Tool>[] = React.useMemo(
    () => [
      {
        id: "select",
        enableHiding: false,
        size: 36,
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
        header: ({ column }) => <SortableHeader column={column} label="Name" />,
        cell: ({ row }) => {
          const tool = row.original;
          return (
            <div className="flex items-center gap-3">
              <ToolIcon iconKey={tool.iconKey} type={tool.type} />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate max-w-[180px]">
                  {tool.name}
                </span>
                {tool.url && (
                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {tool.url}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: ({ column }) => <SortableHeader column={column} label="Type" />,
        cell: ({ row }) => {
          const type = row.getValue<Tool["type"]>("type");
          return (
            <Badge
              variant={type === "webhook" ? "default" : "secondary"}
              className="capitalize"
            >
              {type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
            {row.getValue<string>("description") || "—"}
          </span>
        ),
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => {
          const method = row.getValue<string | undefined>("method");
          return method ? (
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              {method}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const tool = row.original;
          return (
            <Switch
              checked={tool.status === "active"}
              onCheckedChange={() => onToggleStatus(tool.id)}
            />
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column} label="Created" />
        ),
        cell: ({ row }) => {
          const date = row.getValue<Date>("createdAt");
          return (
            <span className="text-sm text-muted-foreground">
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          );
        },
        sortingFn: (a, b) =>
          a.original.createdAt.getTime() - b.original.createdAt.getTime(),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const tool = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(tool)}>
                  Edit tool
                </DropdownMenuItem>
                <DropdownMenuItem>View logs</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(tool.id)}
                >
                  Delete tool
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onEdit, onDelete, onToggleStatus],
  );

  const table = useReactTable({
    data: tools,
    columns,
    state: { sorting, columnVisibility, rowSelection },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const COLUMN_LABELS: Record<string, string> = {
    name: "Name",
    type: "Type",
    description: "Description",
    method: "Method",
    status: "Status",
    createdAt: "Created",
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow
                key={hg.id}
                className="hover:bg-transparent border-b border-border bg-muted/40"
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
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
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
                  No tools found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {Object.keys(rowSelection).length > 0 && (
        <p className="text-xs text-muted-foreground">
          {Object.keys(rowSelection).length} of {tools.length} row(s) selected
        </p>
      )}
    </div>
  );
}
