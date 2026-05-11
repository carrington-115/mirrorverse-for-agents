"use client";

import { Loader2 } from "lucide-react";
import { DirectoryCard } from "./directory-card";
import type { DirectoryEntry } from "../api/types";

interface DirectoryGridProps {
  entries: readonly DirectoryEntry[];
  loading?: boolean;
  emptyMessage?: string;
  onAdd?: (entry: DirectoryEntry) => void;
  onViewDetails?: (entry: DirectoryEntry) => void;
}

export function DirectoryGrid({
  entries,
  loading,
  emptyMessage = "No integrations match your search.",
  onAdd,
  onViewDetails,
}: DirectoryGridProps) {
  if (loading && entries.length === 0) {
    return (
      <div className="py-16 flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-16 text-sm flex flex-1 items-center justify-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 grid w-full grid-cols-3">
      {entries.map((entry) => (
        <DirectoryCard key={entry.id} entry={entry} onAdd={onAdd} onViewDetails={onViewDetails} />
      ))}
    </div>
  );
}
