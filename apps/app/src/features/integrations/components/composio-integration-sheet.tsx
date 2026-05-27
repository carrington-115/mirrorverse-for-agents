"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { Plug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTRPC } from "@/lib/trpc/client";
import type { ComposioIntegrationItem } from "./composio-integration-card";

interface ComposioIconProps {
  item: Pick<ComposioIntegrationItem, "name" | "logoUrl">;
  size?: number;
}

function ComposioIcon({ item, size = 32 }: ComposioIconProps) {
  const [errored, setErrored] = useState(false);

  if (!item.logoUrl || errored) {
    return <Plug className="text-muted-foreground" size={size} />;
  }

  return (
    <Image
      src={item.logoUrl}
      alt={item.name}
      width={size}
      height={size}
      unoptimized
      className="object-contain"
      onError={() => setErrored(true)}
    />
  );
}

interface ComposioIntegrationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ComposioIntegrationItem | null;
}

export function ComposioIntegrationSheet({
  open,
  onOpenChange,
  item,
}: ComposioIntegrationSheetProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object" || event.data.type !== "oauth_callback")
        return;

      const { status } = event.data as { status: string };
      popupRef.current = null;

      if (status === "success" || status === "already_resolved") {
        void queryClient.invalidateQueries(trpc.tools.listConnections.queryFilter());
        toast.success(`${item?.name ?? "Integration"} connected successfully.`);
        onOpenChange(false);
      } else {
        toast.error(
          `Could not complete the connection for ${item?.name ?? "this integration"}. Please try again.`,
        );
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [item, onOpenChange, queryClient, trpc]);

  const connectMutation = useMutation(trpc.connections.initiateAppConnection.mutationOptions());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:w-[50vw] sm:max-w-none flex flex-col overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle>{item?.name ?? "Integration details"}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="about" className="min-h-0 px-4 flex flex-1 flex-col">
          <TabsList variant="line">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            {item && item.triggers.length > 0 && (
              <TabsTrigger value="triggers">Triggers</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="tools" className="mt-4 gap-2 flex flex-1 flex-col overflow-y-auto">
            {item && item.tools.length > 0 ? (
              <ul className="gap-3 flex flex-col">
                {item.tools.map((tool) => (
                  <li key={tool.slug} className="gap-1.5 flex flex-col">
                    <Badge variant="secondary" className="text-xs w-fit font-mono">
                      {tool.slug}
                    </Badge>
                    {tool.description && (
                      <span className="text-xs text-muted-foreground">{tool.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {item
                  ? "No tools listed for this integration."
                  : "Select an integration to see its tools."}
              </p>
            )}
          </TabsContent>

          <TabsContent value="triggers" className="mt-4 gap-2 flex flex-1 flex-col overflow-y-auto">
            {item && item.triggers.length > 0 ? (
              <ul className="gap-3 flex flex-col">
                {item.triggers.map((trigger) => (
                  <li key={trigger.slug} className="gap-1.5 flex flex-col">
                    <Badge variant="secondary" className="text-xs w-fit font-mono">
                      {trigger.slug}
                    </Badge>
                    {trigger.description && (
                      <span className="text-xs text-muted-foreground">{trigger.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {item
                  ? "No triggers listed for this integration."
                  : "Select an integration to see its triggers."}
              </p>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-4 overflow-y-auto">
            {item ? (
              <div className="gap-3 flex flex-col">
                <div className="gap-3 flex items-center">
                  <ComposioIcon item={item} size={32} />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">via Composio</p>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {item.tools.length} tool{item.tools.length !== 1 ? "s" : ""} available
                </p>
                {item.triggers.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {item.triggers.length} trigger{item.triggers.length !== 1 ? "s" : ""} available
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No integration selected.</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="p-4">
          <Button
            className="w-full cursor-pointer"
            disabled={!item || connectMutation.isPending}
            onClick={() => {
              if (!item) return;
              connectMutation.mutate(
                { appSlug: item.slug },
                {
                  onSuccess: ({ redirectUrl }) => {
                    if (redirectUrl) {
                      popupRef.current = window.open(redirectUrl, "_blank", "width=600,height=700");
                    } else {
                      void queryClient.invalidateQueries(trpc.tools.listConnections.queryFilter());
                      toast.success(`${item.name} connected successfully.`);
                    }
                    onOpenChange(false);
                  },
                  onError: () => {
                    toast.error(
                      `Could not connect ${item.name}. Please check your Composio dashboard.`,
                    );
                  },
                },
              );
            }}
          >
            {connectMutation.isPending ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
