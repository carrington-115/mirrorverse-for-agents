"use client";

import { Button } from "@/components/ui/button";
import { DirectoryIcon } from "./directory-icon";
import type { DirectoryEntry } from "../api/types";

interface DirectoryCardProps {
  entry: DirectoryEntry;
  onAdd?: (entry: DirectoryEntry) => void;
  onViewDetails?: (entry: DirectoryEntry) => void;
}

export function DirectoryCard({ entry, onAdd, onViewDetails }: DirectoryCardProps) {
  return (
    <div className="gap-3 p-4 hover:shadow-sm flex cursor-pointer flex-col justify-between rounded-xl border border-border bg-background transition-shadow">
      <div className="gap-1.5 flex flex-col">
        <DirectoryIcon entry={entry} size={24} className="size-6" />
        <h3 className="text-md font-semibold text-foreground">{entry.displayName}</h3>
        <p className="text-sm leading-relaxed line-clamp-3 text-muted-foreground">
          {entry.oneLiner ?? entry.description ?? ""}
        </p>
      </div>

      <div className="gap-2 flex w-full justify-between">
        <Button
          size="sm"
          className="text-xs w-1/2 cursor-pointer"
          onClick={() => onAdd?.(entry)}
          disabled={!onAdd}
        >
          Add integration
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs w-1/2 cursor-pointer"
          onClick={() => onViewDetails?.(entry)}
          disabled={!onViewDetails}
        >
          View details
        </Button>
      </div>
    </div>
  );
}
