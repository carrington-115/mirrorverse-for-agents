"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";

export interface ComposioIntegrationItem {
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  tools: readonly { slug: string; description: string }[];
}

interface ComposioIntegrationIconProps {
  item: Pick<ComposioIntegrationItem, "name" | "logoUrl">;
  size?: number;
  className?: string;
}

function ComposioIntegrationIcon({ item, size = 24, className }: ComposioIntegrationIconProps) {
  const [errored, setErrored] = useState(false);

  if (!item.logoUrl || errored) {
    return <Plug className={`text-muted-foreground ${className ?? ""}`} size={size} />;
  }

  return (
    <Image
      src={item.logoUrl}
      alt={item.name}
      width={size}
      height={size}
      unoptimized
      className={`object-contain ${className ?? ""}`}
      onError={() => setErrored(true)}
    />
  );
}

export function ComposioIntegrationCardSkeleton() {
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

interface ComposioIntegrationCardProps {
  item: ComposioIntegrationItem;
  onViewDetails?: (item: ComposioIntegrationItem) => void;
}

export function ComposioIntegrationCard({ item, onViewDetails }: ComposioIntegrationCardProps) {
  const trpc = useTRPC();
  const connectMutation = useMutation(
    trpc.connections.initiateAppConnection.mutationOptions({
      onSuccess: ({ redirectUrl }) => {
        if (redirectUrl) {
          window.open(redirectUrl, "_blank", "noopener,noreferrer,width=600,height=700");
        }
      },
      onError: () => {
        toast.error(`Could not connect ${item.name}. Please check your Composio dashboard.`);
      },
    }),
  );

  return (
    <div className="gap-3 p-4 hover:shadow-sm flex cursor-pointer flex-col justify-between rounded-xl border border-border bg-background transition-shadow">
      <div className="gap-1.5 flex flex-col">
        <ComposioIntegrationIcon item={item} size={24} className="size-6" />
        <h3 className="text-md font-semibold text-foreground">{item.name}</h3>
        <p className="text-sm leading-relaxed line-clamp-3 text-muted-foreground">
          {item.description ?? `${item.tools.length} tools available`}
        </p>
      </div>

      <div className="gap-2 flex w-full justify-between">
        <Button
          size="sm"
          className="text-xs w-1/2 cursor-pointer"
          onClick={() => connectMutation.mutate({ appSlug: item.slug })}
          disabled={connectMutation.isPending}
        >
          {connectMutation.isPending ? "Connecting..." : "Connect"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs w-1/2 cursor-pointer"
          onClick={() => onViewDetails?.(item)}
          disabled={!onViewDetails}
        >
          Details
        </Button>
      </div>
    </div>
  );
}
