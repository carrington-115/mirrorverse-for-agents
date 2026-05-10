"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpDown, GripVertical, MoreHorizontal, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KnowledgeBaseItem, KnowledgeBaseTableProps } from "@/lib/types";
import { KnowledgeBaseEmpty } from "./knowledge-base-empty";

const FILE_TYPE_STYLES: Record<KnowledgeBaseItem["fileType"], { bg: string; text: string }> = {
  URL: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
  },
  File: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function KnowledgeBaseTable({
  items,
  searchQuery: controlledQuery,
  onSearchChange,
  onItemAction,
  className,
}: KnowledgeBaseTableProps) {
  const [internalQuery, setInternalQuery] = useState("");

  const query = controlledQuery ?? internalQuery;
  const setQuery = onSearchChange ?? setInternalQuery;

  /* Filter items by search query */
  const filtered = items.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.url?.toLowerCase().includes(q) ||
      item.createdBy.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className={cn("gap-4 flex w-full flex-col", className)}>
      {/* Search bar */}
      <div className="relative">
        <Search className="left-3 size-4 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="kb-search"
          placeholder="Search knowledge base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <KnowledgeBaseEmpty onAddContent={() => console.log("Add content")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px]">
                <Checkbox aria-label="Select all" />
              </TableHead>
              <TableHead>
                <button className="gap-1 inline-flex items-center">
                  Name <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>
                <button className="gap-1 inline-flex items-center">
                  Created by <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>Total RAG Search</TableHead>
              <TableHead>File type</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((item) => {
              const initials = item.createdBy.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              const style = FILE_TYPE_STYLES[item.fileType];

              return (
                <TableRow key={item.id}>
                  {/* Drag handle + checkbox */}
                  <TableCell>
                    <div className="gap-1 flex items-center">
                      <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/50" />
                      <Checkbox aria-label={`Select ${item.name}`} />
                    </div>
                  </TableCell>

                  {/* Name + URL */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      {item.url && (
                        <span className="text-xs text-muted-foreground">{item.url}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Created by */}
                  <TableCell>
                    <div className="gap-2 flex items-center">
                      <Avatar size="sm">
                        {item.createdBy.avatar && <AvatarImage src={item.createdBy.avatar} />}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span>{item.createdBy.name}</span>
                    </div>
                  </TableCell>

                  {/* Total RAG search */}
                  <TableCell>{item.totalRagSearch}</TableCell>

                  {/* File type badge */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("font-medium rounded-full border-none", style.bg, style.text)}
                    >
                      {item.fileType}
                    </Badge>
                  </TableCell>

                  {/* Last updated */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatDate(item.lastUpdated)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(item.lastUpdated)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="gap-1 cursor-pointer text-muted-foreground"
                        >
                          More
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onItemAction?.(item, "edit")}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onItemAction?.(item, "duplicate")}>
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onItemAction?.(item, "delete")}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
