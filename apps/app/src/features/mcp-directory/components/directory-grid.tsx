"use client";

import { DirectoryCard, DirectoryCardSkeleton } from "./directory-card";
import type { DirectoryEntry } from "../api/types";

interface DirectoryGridProps {
  entries: readonly DirectoryEntry[];
  loading?: boolean;
  emptyMessage?: string;
  onViewDetails?: (entry: DirectoryEntry) => void;
}

export function DirectoryGrid({
  entries,
  loading,
  emptyMessage = "No integrations match your search.",
  onViewDetails,
}: DirectoryGridProps) {
  if (loading && entries.length === 0) {
    return (
      <div className="sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 grid w-full grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <DirectoryCardSkeleton key={i} />
        ))}
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
        <DirectoryCard key={entry.id} entry={entry} onViewDetails={onViewDetails} />
      ))}
    </div>
  );
}
