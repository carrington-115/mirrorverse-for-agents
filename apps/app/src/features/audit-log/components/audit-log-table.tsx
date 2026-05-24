"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogQuery } from "../api/queries";

interface AuditLogTableProps {
  workspaceId: string;
}

export function AuditLogTable({ workspaceId }: AuditLogTableProps) {
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();

  const { data, isLoading, isError } = useAuditLogQuery(workspaceId, {
    action: search.trim() || undefined,
    cursor,
  });

  const items = data?.items ?? [];

  return (
    <div className="gap-4 flex flex-col">
      <div className="gap-2 flex items-center">
        <div className="max-w-xs relative flex-1">
          <Search className="left-2.5 top-2.5 size-4 absolute text-muted-foreground" />
          <Input
            placeholder="Filter by action&hellip;"
            className="pl-8"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(action);
            }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setSearch(action)}>
          Search
        </Button>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAction("");
              setSearch("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="w-full overflow-clip rounded-(--radius,10px) border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="text-right">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && isError && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-sm text-center text-muted-foreground">
                  Failed to load audit log. You may not have permission to view this page.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-sm text-center text-muted-foreground">
                  No audit log entries found.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {format(new Date(row.ts), "MMM d, HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <code className="px-1 py-0.5 text-xs rounded-sm bg-muted">{row.action}</code>
                  </TableCell>
                  <TableCell className="text-sm max-w-[160px] truncate">{row.userId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.targetKind && row.targetId
                      ? `${row.targetKind}/${row.targetId}`
                      : (row.targetKind ?? "—")}
                  </TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">
                    {row.ip ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {data?.nextCursor && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setCursor(data.nextCursor)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
