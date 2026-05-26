"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import { Plug } from "lucide-react";
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
  const connectMutation = useMutation(
    trpc.connections.initiateAppConnection.mutationOptions({
      onSuccess: ({ redirectUrl }) => {
        if (redirectUrl) {
          window.open(redirectUrl, "_blank", "noopener,noreferrer,width=600,height=700");
        }
        onOpenChange(false);
      },
      onError: () => {
        toast.error(
          `Could not connect ${item?.name ?? "this integration"}. Please check your Composio dashboard.`,
        );
      },
    }),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Integration details</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="tools" className="px-4">
          <TabsList variant="line">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="mt-4 gap-2 flex flex-col">
            {item && item.tools.length > 0 ? (
              <ul className="gap-3 flex flex-col">
                {item.tools.map((tool) => (
                  <li key={tool.slug} className="gap-0.5 flex flex-col">
                    <span className="text-xs font-medium font-mono text-foreground">
                      {tool.slug}
                    </span>
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

          <TabsContent value="about" className="mt-4">
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
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No integration selected.</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="p-4 mt-auto">
          <Button
            className="w-full cursor-pointer"
            disabled={!item || connectMutation.isPending}
            onClick={() => {
              if (item) connectMutation.mutate({ appSlug: item.slug });
            }}
          >
            {connectMutation.isPending ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
