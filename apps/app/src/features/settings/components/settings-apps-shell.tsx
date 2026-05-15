"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
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

export function AppsSettingsShell() {
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
          <CardTitle>Installed apps</CardTitle>
          <CardDescription>Apps and integrations connected to your workspace.</CardDescription>
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
          <div className="gap-3 sm:grid-cols-2 grid grid-cols-1">
            {INTEGRATIONS.map((integration) => {
              const Icon = integration.icon;
              return (
                <div
                  key={integration.id}
                  className="gap-3 p-3 flex items-center justify-between rounded-lg border border-border"
                >
                  <div className="gap-3 min-w-0 flex items-center">
                    <div className="size-8 flex shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className={cn("size-4", integration.iconColor)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate leading-none">
                        {integration.name}
                      </p>
                      <p className="text-xs mt-0.5 text-muted-foreground">Not connected</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => toast.info(`Connect ${integration.name} — coming soon`)}
                  >
                    Connect
                  </Button>
                </div>
              );
            })}
          </div>
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
