"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ExternalLink, Loader2, Plug, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/lib/trpc/client";

type CardStatus = "idle" | "connecting" | "connected";

interface AppConnectPanelProps {
  appSlugs: readonly string[];
  chatId: string;
  onDismiss: () => void;
}

export function AppConnectPanel({ appSlugs, chatId, onDismiss }: AppConnectPanelProps) {
  const trpc = useTRPC();
  const [cardStatuses, setCardStatuses] = useState<Record<string, CardStatus>>(() =>
    Object.fromEntries(appSlugs.map((s) => [s, "idle" as CardStatus])),
  );

  const { data: toolkitList, isLoading } = useQuery(
    trpc.connections.toolkitInfo.queryOptions({ slugs: [...appSlugs] }),
  );

  const initiateMutation = useMutation(trpc.connections.initiateAppConnection.mutationOptions());

  const handleConnect = useCallback(
    async (slug: string) => {
      setCardStatuses((prev) => ({ ...prev, [slug]: "connecting" }));
      try {
        const { redirectUrl } = await initiateMutation.mutateAsync({ appSlug: slug, chatId });
        // redirectUrl is null when the account already existed in Composio and was synced
        // to the DB — no OAuth popup needed; polling will detect the connection shortly.
        if (redirectUrl) {
          window.open(redirectUrl, "_blank", "noopener,noreferrer,width=600,height=700");
        }
      } finally {
        // Revert to idle — the polling loop drives actual dismissal when all connected.
        setCardStatuses((prev) => ({ ...prev, [slug]: "idle" }));
      }
    },
    [initiateMutation, chatId],
  );

  const displayItems =
    toolkitList ??
    appSlugs.map((slug) => ({
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      logoUrl: null,
      description: null,
      toolsCount: null,
    }));

  return (
    <div className="px-3 pb-3 mx-auto w-full max-w-[780px] animate-in duration-200 slide-in-from-bottom-4">
      <div className="p-4 shadow-sm rounded-xl border border-border bg-card">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            Connect {appSlugs.length === 1 ? "an app" : "apps"} to continue
          </p>
          <Button variant="ghost" size="icon" className="size-7" onClick={onDismiss}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="gap-3 flex flex-wrap">
          {isLoading
            ? appSlugs.map((slug) => <AppCardSkeleton key={slug} />)
            : displayItems.map((info) => (
                <AppCard
                  key={info.slug}
                  info={info}
                  status={cardStatuses[info.slug] ?? "idle"}
                  onConnect={handleConnect}
                />
              ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Connect each app then re-send your message to continue.
        </p>
      </div>
    </div>
  );
}

interface ToolkitDisplayInfo {
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  toolsCount: number | null;
}

function AppCard({
  info,
  status,
  onConnect,
}: {
  info: ToolkitDisplayInfo;
  status: CardStatus;
  onConnect: (slug: string) => void;
}) {
  const [imgErrored, setImgErrored] = useState(false);
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div
      className={cn(
        "w-52 gap-2 p-3 flex shrink-0 flex-col rounded-lg border transition-colors",
        isConnected
          ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20"
          : "border-border bg-background",
      )}
    >
      <div className="gap-2 flex items-center">
        <div className="size-8 flex shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
          {info.logoUrl && !imgErrored ? (
            <Image
              src={info.logoUrl}
              alt={info.name}
              width={20}
              height={20}
              unoptimized
              onError={() => setImgErrored(true)}
              className="object-contain"
            />
          ) : (
            <Plug className="size-4 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm font-semibold leading-tight text-foreground">{info.name}</p>
      </div>

      {info.description && (
        <p className="text-xs leading-relaxed line-clamp-2 text-muted-foreground">
          {info.description}
        </p>
      )}

      {info.toolsCount != null && (
        <p className="text-xs text-muted-foreground">
          {info.toolsCount} tool{info.toolsCount !== 1 ? "s" : ""} available
        </p>
      )}

      {isConnected ? (
        <div className="gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 flex items-center">
          <CheckCircle2 className="size-3.5" />
          Connected
        </div>
      ) : (
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={isConnecting}
          onClick={() => onConnect(info.slug)}
        >
          {isConnecting ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              Opening&hellip;
            </>
          ) : (
            <>
              <ExternalLink className="size-3" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function AppCardSkeleton() {
  return (
    <div className="w-52 animate-pulse p-3 rounded-lg border border-border bg-background">
      <div className="mb-2 gap-2 flex items-center">
        <div className="size-8 rounded-lg bg-muted" />
        <div className="h-3 w-24 rounded-sm bg-muted" />
      </div>
      <div className="mb-1 h-2 w-full rounded-sm bg-muted" />
      <div className="h-2 w-3/4 rounded-sm bg-muted" />
      <div className="mt-2 h-7 w-full rounded-sm bg-muted" />
    </div>
  );
}
