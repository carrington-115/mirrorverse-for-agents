"use client";

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
  useCapacityCountsQuery,
  useCurrentPlanQuery,
  useUsageByDayQuery,
  useUsagePeriodQuery,
} from "@/features/billing/api/queries";
import { useSettingsModal } from "../hooks/use-settings-modal";

const tokenChartConfig = {
  llm_input: { label: "Input tokens", color: "var(--chart-1)" },
  llm_output: { label: "Output tokens", color: "var(--chart-2)" },
  llm_input_cache_read: { label: "Cached tokens", color: "var(--chart-3)" },
} satisfies ChartConfig;

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function progressColorClass(pct: number) {
  if (pct >= 90) return "[&>div]:bg-destructive";
  if (pct >= 75) return "[&>div]:bg-amber-500";
  return "";
}

interface MetricRowProps {
  label: string;
  used: number;
  limit: number;
  formatValue?: (n: number) => string;
  onUpgrade?: () => void;
}

function MetricRow({ label, used, limit, formatValue, onUpgrade }: MetricRowProps) {
  const fmt = formatValue ?? ((n: number) => n.toLocaleString());
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = pct >= 75;

  return (
    <div className="py-2.5 gap-1.5 flex flex-col">
      <div className="text-sm gap-2 flex items-center justify-between">
        <span>{label}</span>
        <div className="gap-2 flex items-center">
          <span
            className={cn(
              "text-muted-foreground tabular-nums",
              pct >= 90 && "text-destructive",
              pct >= 75 && pct < 90 && "text-amber-500",
            )}
          >
            {fmt(used)} / {fmt(limit)}
          </span>
          {isNearLimit && onUpgrade && (
            <button
              onClick={onUpgrade}
              className={cn(
                "text-xs cursor-pointer underline underline-offset-2 transition-colors",
                pct >= 90
                  ? "text-destructive hover:text-destructive/80"
                  : "text-amber-500 hover:text-amber-400",
              )}
            >
              Upgrade
            </button>
          )}
        </div>
      </div>
      <Progress value={pct} className={progressColorClass(pct)} />
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="py-2.5 flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function UsageSettingsShell() {
  const { navigateTo } = useSettingsModal();
  const { data: planData, isLoading: planLoading } = useCurrentPlanQuery();
  const { data: usageData, isLoading: usageLoading } = useUsagePeriodQuery();
  const { data: usageByDayData, isLoading: usageByDayLoading } = useUsageByDayQuery();
  const { data: capacityData, isLoading: capacityLoading } = useCapacityCountsQuery();

  const limits = planData?.plan?.limits;
  const periodEnd = usageData?.periodEnd;

  const usageMap = new Map<string, { quantity: number; costCents: number }>();
  for (const u of usageData?.usage ?? []) {
    usageMap.set(u.kind, { quantity: u.totalQuantity, costCents: u.totalCostCents });
  }

  const totalTokensUsed =
    (usageMap.get("llm_input")?.quantity ?? 0) + (usageMap.get("llm_output")?.quantity ?? 0);
  const voiceMinutesUsed = usageMap.get("voice_minute")?.quantity ?? 0;
  const sandboxSecondsUsed = usageMap.get("sandbox_second")?.quantity ?? 0;
  const totalCostCents = [...usageMap.values()].reduce((sum, u) => sum + u.costCents, 0);

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

  const isLoading = planLoading || usageLoading || capacityLoading;
  const upgrade = () => navigateTo("pricing");

  const fmtDollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

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
          <CardTitle>Usage breakdown</CardTitle>
          <CardDescription>
            Consumption and capacity against your plan&apos;s included limits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="gap-4 flex flex-col">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="gap-1.5 flex flex-col">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {limits && limits.includedCredits > 0 && (
                <MetricRow
                  label="Credits"
                  used={totalCostCents}
                  limit={limits.includedCredits * 100}
                  formatValue={fmtDollars}
                  onUpgrade={upgrade}
                />
              )}
              {limits && limits.includedTokens > 0 && (
                <MetricRow
                  label="LLM tokens"
                  used={totalTokensUsed}
                  limit={limits.includedTokens}
                  formatValue={(n) =>
                    n >= 1_000_000
                      ? `${(n / 1_000_000).toFixed(2)}M`
                      : n >= 1_000
                        ? `${(n / 1_000).toFixed(1)}K`
                        : n.toLocaleString()
                  }
                  onUpgrade={upgrade}
                />
              )}
              {limits && limits.includedVoiceMinutes > 0 && (
                <MetricRow
                  label="Voice minutes"
                  used={voiceMinutesUsed}
                  limit={limits.includedVoiceMinutes}
                  onUpgrade={upgrade}
                />
              )}
              {limits && limits.includedSandboxSeconds > 0 && (
                <MetricRow
                  label="Sandbox seconds"
                  used={sandboxSecondsUsed}
                  limit={limits.includedSandboxSeconds}
                  onUpgrade={upgrade}
                />
              )}
              {limits?.maxRunsPerDay !== null && limits?.maxRunsPerDay !== undefined && (
                <MetricRow
                  label="Runs today"
                  used={capacityData?.runsToday ?? 0}
                  limit={limits.maxRunsPerDay}
                  onUpgrade={upgrade}
                />
              )}
              {limits?.maxWorkflowGenerationsPerPeriod !== null &&
                limits?.maxWorkflowGenerationsPerPeriod !== undefined && (
                  <MetricRow
                    label="Workflow generations"
                    used={capacityData?.generationsThisPeriod ?? 0}
                    limit={limits.maxWorkflowGenerationsPerPeriod}
                    onUpgrade={upgrade}
                  />
                )}
              {limits?.maxConnections !== null && limits?.maxConnections !== undefined && (
                <MetricRow
                  label="Integrations"
                  used={capacityData?.connectionsCount ?? 0}
                  limit={limits.maxConnections}
                  onUpgrade={upgrade}
                />
              )}
              {limits?.maxWorkflows !== null && limits?.maxWorkflows !== undefined && (
                <InfoRow label="Workflows" value={limits.maxWorkflows.toLocaleString()} />
              )}
              {limits?.maxVoiceAgents !== null && limits?.maxVoiceAgents !== undefined && (
                <InfoRow label="Voice agents" value={limits.maxVoiceAgents.toLocaleString()} />
              )}
              {limits?.maxKnowledgeBases !== null && limits?.maxKnowledgeBases !== undefined && (
                <InfoRow
                  label="Knowledge bases"
                  value={limits.maxKnowledgeBases.toLocaleString()}
                />
              )}
              {limits?.maxMembers !== null && limits?.maxMembers !== undefined && (
                <InfoRow label="Team members" value={limits.maxMembers.toLocaleString()} />
              )}
              {limits?.maxFileUploadMb !== null && limits?.maxFileUploadMb !== undefined && (
                <InfoRow label="Max file upload" value={`${limits.maxFileUploadMb} MB`} />
              )}
              {!limits && (
                <p className="text-sm py-4 text-center text-muted-foreground">
                  No plan limits to display.
                </p>
              )}
            </div>
          )}
        </CardContent>
        {!isLoading && limits && (
          <CardFooter>
            <Button variant="outline" size="sm" onClick={upgrade}>
              Upgrade for more
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
