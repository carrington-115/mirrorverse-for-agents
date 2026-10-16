"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  useDailyCreditUsageQuery,
  useUsagePeriodQuery,
} from "@/features/billing/api/queries";
import { useSettingsModal } from "../hooks/use-settings-modal";

const creditChartConfig = {
  credits: { label: "Credits", color: "hsl(var(--chart-1))" },
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
  const { data: capacityData, isLoading: capacityLoading } = useCapacityCountsQuery();
  const { data: dailyCredits, isLoading: dailyCreditsLoading } = useDailyCreditUsageQuery();

  const limits = planData?.plan?.limits;
  const periodEnd = usageData?.periodEnd;

  const usageMap = new Map<string, { quantity: number; credits: number }>();
  for (const u of usageData?.usage ?? []) {
    usageMap.set(u.kind, { quantity: u.totalQuantity, credits: u.totalCredits });
  }

  const voiceMinutesUsed = usageMap.get("voice_minute")?.quantity ?? 0;
  const sandboxSecondsUsed = usageMap.get("sandbox_second")?.quantity ?? 0;
  const totalCreditsUsed = [...usageMap.values()].reduce((sum, u) => sum + u.credits, 0);
  const bonusCredits = usageData?.bonusCredits;

  const isLoading = planLoading || usageLoading || capacityLoading;

  const creditChartData = (dailyCredits ?? []).map((d) => ({
    day: d.day,
    credits: d.totalCredits,
  }));
  const upgrade = () => navigateTo("pricing");

  const fmtCredits = (n: number) => n.toLocaleString();

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
          <CardTitle>
            {limits?.creditsPeriod === "day" ? "Credit reset" : "Billing period"}
          </CardTitle>
          <CardDescription>
            {limits?.creditsPeriod === "day"
              ? "Credits reset daily at midnight UTC."
              : "Usage resets at the start of each billing period."}
          </CardDescription>
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
          <CardTitle>Daily credit usage</CardTitle>
          <CardDescription>Credits spent per day in the current billing period.</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyCreditsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : creditChartData.length === 0 ? (
            <p className="text-sm py-8 text-center text-muted-foreground">No usage this period.</p>
          ) : (
            <ChartContainer config={creditChartConfig} className="h-48 w-full">
              <BarChart data={creditChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00Z");
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v: number) => v.toLocaleString()}
                  width={56}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [`${(+value).toLocaleString()} credits`, "Credits"]}
                    />
                  }
                />
                <Bar dataKey="credits" fill="var(--foreground)" radius={[4, 4, 0, 0]} />
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
                  label={limits.creditsPeriod === "day" ? "Credits (daily)" : "Credits"}
                  used={totalCreditsUsed}
                  limit={limits.includedCredits}
                  formatValue={fmtCredits}
                  onUpgrade={upgrade}
                />
              )}
              {bonusCredits && bonusCredits.granted > 0 && (
                <InfoRow
                  label="Bonus credits remaining"
                  value={`${fmtCredits(bonusCredits.remaining)} / ${fmtCredits(bonusCredits.granted)}`}
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
              {limits?.maxRunsPerMonth !== null && limits?.maxRunsPerMonth !== undefined && (
                <MetricRow
                  label="Runs this month"
                  used={capacityData?.runsThisPeriod ?? 0}
                  limit={limits.maxRunsPerMonth}
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
