"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";
import { DirectoryIcon } from "./directory-icon";
import type { DirectoryEntry } from "../api/types";

export function DirectoryCardSkeleton() {
  return (
    <div className="gap-3 p-4 flex min-h-[180px] flex-col justify-between rounded-xl border border-border bg-background">
      <div className="gap-2 flex flex-col">
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="h-4 w-2/3" />
        <div className="gap-1 flex flex-col">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="gap-2 flex w-full">
        <Skeleton className="h-8 w-1/2 rounded-md" />
        <Skeleton className="h-8 w-1/2 rounded-md" />
      </div>
    </div>
  );
}

interface DirectoryCardProps {
  entry: DirectoryEntry;
  onViewDetails?: (entry: DirectoryEntry) => void;
}

export function DirectoryCard({ entry, onViewDetails }: DirectoryCardProps) {
  const trpc = useTRPC();
  const connectMutation = useMutation(
    trpc.connections.initiateAppConnection.mutationOptions({
      onSuccess: ({ redirectUrl }) => {
        if (redirectUrl) {
          window.open(redirectUrl, "_blank", "noopener,noreferrer,width=600,height=700");
        }
      },
      onError: () => {
        toast.error(
          `Could not connect ${entry.displayName}. Please add it on your Composio dashboard.`,
        );
      },
    }),
  );

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
          onClick={() => connectMutation.mutate({ appSlug: entry.slug })}
          disabled={connectMutation.isPending}
        >
          {connectMutation.isPending ? "Connecting..." : "Connect"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs w-1/2 cursor-pointer"
          onClick={() => onViewDetails?.(entry)}
          disabled={!onViewDetails}
        >
          Details
        </Button>
      </div>
    </div>
  );
}
