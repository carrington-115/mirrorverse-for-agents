"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const QUOTAS = [
  {
    label: "LLM tokens",
    used: 0,
    limit: 100_000,
    display: (n: number) => n.toLocaleString(),
    unit: "tokens",
  },
  {
    label: "Voice minutes",
    used: 0,
    limit: 60,
    display: (n: number) => String(n),
    unit: "min",
  },
  {
    label: "Sandbox seconds",
    used: 0,
    limit: 3_600,
    display: (n: number) => String(n),
    unit: "sec",
  },
  {
    label: "Workflows",
    used: 0,
    limit: 1,
    display: (n: number) => String(n),
    unit: "workflows",
  },
  {
    label: "Members",
    used: 1,
    limit: 1,
    display: (n: number) => String(n),
    unit: "seats",
  },
  {
    label: "Connections",
    used: 0,
    limit: 5,
    display: (n: number) => String(n),
    unit: "connections",
  },
];

function progressColorClass(pct: number) {
  if (pct >= 90) return "[&>div]:bg-destructive";
  if (pct >= 75) return "[&>div]:bg-amber-500";
  return "";
}

function nextResetDate() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return first.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function UsageSettingsShell() {
  return (
    <div className="gap-6 max-w-2xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Usage</h1>
        <p className="text-sm text-muted-foreground">
          Monitor your workspace usage against plan limits.
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Billing period</CardTitle>
          <CardDescription>Usage resets at the start of each billing period.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Next reset</span>
            <span className="font-medium">{nextResetDate()}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current period</CardTitle>
          <CardDescription>Usage against your plan&apos;s limits this period.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="gap-5 flex flex-col">
            {QUOTAS.map((quota) => {
              const pct = quota.limit > 0 ? Math.min((quota.used / quota.limit) * 100, 100) : 0;
              const isNearLimit = pct >= 75;
              return (
                <div key={quota.label} className="gap-1.5 flex flex-col">
                  <div className="text-sm flex items-center justify-between">
                    <span>{quota.label}</span>
                    <div className="gap-2 flex items-center">
                      <span
                        className={cn(
                          "text-muted-foreground",
                          pct >= 90 && "text-destructive",
                          pct >= 75 && pct < 90 && "text-amber-500",
                        )}
                      >
                        {quota.display(quota.used)} / {quota.display(quota.limit)} {quota.unit}
                      </span>
                      {isNearLimit && (
                        <Link
                          href="/settings/pricing"
                          className={cn(
                            "text-xs underline underline-offset-2 transition-colors",
                            pct >= 90
                              ? "text-destructive hover:text-destructive/80"
                              : "text-amber-500 hover:text-amber-400",
                          )}
                        >
                          Upgrade
                        </Link>
                      )}
                    </div>
                  </div>
                  <Progress value={pct} className={progressColorClass(pct)} />
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/pricing">Upgrade for more</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
