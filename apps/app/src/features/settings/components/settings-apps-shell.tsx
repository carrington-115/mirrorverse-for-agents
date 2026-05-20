"use client";

import Link from "next/link";
import { AppWindow, ArrowRight, CheckCircle2, Loader2, Shapes } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { INTEGRATIONS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useConnectionsQuery } from "@/features/integrations/api/queries";
import { useRevokeConnectionMutation } from "@/features/integrations/api/mutations";

function iconForSlug(appSlug: string) {
  const match = INTEGRATIONS.find(
    (i) =>
      i.id.toLowerCase() === appSlug.toLowerCase() ||
      i.name.toLowerCase() === appSlug.toLowerCase(),
  );
  return match ? { Icon: match.icon, colorClass: match.iconColor } : null;
}

export function AppsSettingsShell() {
  const { data: connections, isLoading } = useConnectionsQuery();
  const revokeConnection = useRevokeConnectionMutation();

  const activeConnections = (connections ?? []).filter((c) => c.status === "active");

  return (
    <div className="gap-6 max-w-2xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Apps</h1>
        <p className="text-sm text-muted-foreground">
          Connected apps and integrations available in your workspace.
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Connected apps</CardTitle>
          <CardDescription>Apps and integrations active in your workspace.</CardDescription>
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link href="/integrations">
                Manage all
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex items-center justify-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin mr-2" />
              <span className="text-sm">Loading connections…</span>
            </div>
          ) : activeConnections.length === 0 ? (
            <div className="gap-3 py-8 flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-muted">
                <Shapes className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No apps connected yet.</p>
              <p className="text-xs max-w-[240px] text-muted-foreground">
                Browse integrations to connect apps your agents can use.
              </p>
            </div>
          ) : (
            <div className="gap-3 flex flex-col">
              {activeConnections.map((connection) => {
                const iconData = iconForSlug(connection.appSlug);
                const Icon = iconData?.Icon ?? AppWindow;
                const colorClass = iconData?.colorClass ?? "text-muted-foreground";
                const displayName = connection.displayName || connection.appSlug;

                return (
                  <div
                    key={connection.id}
                    className="gap-3 p-3 flex items-center justify-between rounded-lg border border-border"
                  >
                    <div className="gap-3 min-w-0 flex items-center">
                      <div className="size-8 flex shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className={cn("size-4", colorClass)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate leading-none">{displayName}</p>
                        <div className="mt-1 gap-1.5 flex items-center">
                          <CheckCircle2 className="size-3 text-green-600 shrink-0" />
                          <Badge
                            variant="outline"
                            className="h-4 px-1.5 font-medium border-green-200 text-green-700 bg-green-50 text-[10px]"
                          >
                            Connected
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-destructive hover:border-destructive/40 hover:text-destructive"
                      disabled={revokeConnection.isPending}
                      onClick={() => revokeConnection.mutate({ connectionId: connection.id })}
                    >
                      Disconnect
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" size="sm">
            <Link href="/integrations">
              Browse integrations
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
