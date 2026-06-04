"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useCurrentPlanQuery,
  useUsageByDayQuery,
  useUsagePeriodQuery,
} from "@/features/billing/api/queries";

type UsageKind = string;

const KIND_LABELS: Record<UsageKind, string> = {
  llm_input: "LLM input tokens",
  llm_output: "LLM output tokens",
  llm_input_cache_read: "Cached input tokens",
  llm_input_cache_write: "Cache-write tokens",
  voice_minute: "Voice minutes",
  sandbox_second: "Sandbox seconds",
};

const tokenChartConfig = {
  llm_input: { label: "Input tokens", color: "var(--chart-1)" },
  llm_output: { label: "Output tokens", color: "var(--chart-2)" },
  llm_input_cache_read: { label: "Cached tokens", color: "var(--chart-3)" },
} satisfies ChartConfig;

function formatValue(kind: UsageKind, quantity: number): string {
  if (kind.includes("token")) return quantity.toLocaleString();
  return String(quantity);
}

function progressColorClass(pct: number) {
  if (pct >= 90) return "[&>div]:bg-destructive";
  if (pct >= 75) return "[&>div]:bg-amber-500";
  return "";
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function UsageSettingsShell() {
  const { data: planData, isLoading: planLoading } = useCurrentPlanQuery();
  const { data: usageData, isLoading: usageLoading } = useUsagePeriodQuery();
  const { data: usageByDayData, isLoading: usageByDayLoading } = useUsageByDayQuery();

  const limits = planData?.plan?.limits;
  const periodEnd = usageData?.periodEnd;

  const tokenLimit = limits?.includedTokens ?? 100_000;
  const voiceLimit = limits?.includedVoiceMinutes ?? 0;
  const sandboxLimit = limits?.includedSandboxSeconds ?? 0;

  const usage = usageData?.usage ?? [];

  const tokenUsed = usage
    .filter((u) => u.kind.startsWith("llm"))
    .reduce((sum, u) => sum + u.totalQuantity, 0);
  const voiceUsed = usage.find((u) => u.kind === "voice_minute")?.totalQuantity ?? 0;
  const sandboxUsed = usage.find((u) => u.kind === "sandbox_second")?.totalQuantity ?? 0;

  const quotas = [
    {
      label: "LLM tokens",
      used: tokenUsed,
      limit: tokenLimit,
      unit: "tokens",
      display: (n: number) => n.toLocaleString(),
    },
    ...(voiceLimit > 0
      ? [
          {
            label: "Voice minutes",
            used: voiceUsed,
            limit: voiceLimit,
            unit: "min",
            display: (n: number) => String(n),
          },
        ]
      : []),
    ...(sandboxLimit > 0
      ? [
          {
            label: "Sandbox seconds",
            used: sandboxUsed,
            limit: sandboxLimit,
            unit: "sec",
            display: (n: number) => String(n),
          },
        ]
      : []),
  ];

  // Build daily token chart data by pivoting kind rows into columns per date
  const dailyRaw = usageByDayData ?? [];
  const dateMap = new Map<
    string,
    { date: string; llm_input: number; llm_output: number; llm_input_cache_read: number }
  >();
  for (const entry of dailyRaw) {
    if (!entry.kind.startsWith("llm")) continue;
    const d = new Date(entry.periodStart);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    const key = d.toISOString().slice(0, 10);
    if (!dateMap.has(key)) {
      dateMap.set(key, { date: label, llm_input: 0, llm_output: 0, llm_input_cache_read: 0 });
    }
    const row = dateMap.get(key)!;
    if (entry.kind === "llm_input") row.llm_input = entry.totalQuantity;
    else if (entry.kind === "llm_output") row.llm_output = entry.totalQuantity;
    else if (entry.kind === "llm_input_cache_read") row.llm_input_cache_read = entry.totalQuantity;
  }
  const tokenChartData = Array.from(dateMap.values());
  const hasTokenChartData = tokenChartData.length > 0;

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
            <span className="font-medium">
              {planLoading ? <Skeleton className="h-4 w-32" /> : formatDate(periodEnd)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily token usage</CardTitle>
          <CardDescription>LLM tokens consumed per day this billing period.</CardDescription>
        </CardHeader>
        <CardContent>
          {usageByDayLoading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : !hasTokenChartData ? (
            <p className="text-sm py-8 text-center text-muted-foreground">
              No token usage recorded yet this period.
            </p>
          ) : (
            <ChartContainer config={tokenChartConfig} className="h-[180px] w-full">
              <BarChart data={tokenChartData} barGap={2}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="llm_input"
                  stackId="tokens"
                  fill="var(--color-llm_input)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="llm_input_cache_read"
                  stackId="tokens"
                  fill="var(--color-llm_input_cache_read)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="llm_output"
                  stackId="tokens"
                  fill="var(--color-llm_output)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current period</CardTitle>
          <CardDescription>Usage against your plan&apos;s limits this period.</CardDescription>
        </CardHeader>
        <CardContent>
          {usageLoading ? (
            <div className="gap-5 flex flex-col">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="gap-5 flex flex-col">
              {quotas.map((quota) => {
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
          )}
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings/pricing">Upgrade for more</Link>
          </Button>
        </CardFooter>
      </Card>

      {usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage breakdown</CardTitle>
            <CardDescription>All usage events this billing period by type.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm divide-y">
              {usage.map((u) => (
                <li key={u.kind} className="py-2 flex items-center justify-between">
                  <span className="text-muted-foreground">{KIND_LABELS[u.kind] ?? u.kind}</span>
                  <span className="font-medium tabular-nums">
                    {formatValue(u.kind, u.totalQuantity)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
