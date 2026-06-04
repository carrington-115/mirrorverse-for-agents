"use client";

import { useState } from "react";
import { ChevronLeft, ExternalLink, RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkflowsListQuery } from "@/features/workflows/api/queries";
import { useRunQuery, useRunsListQuery, useRunStatsByDayQuery } from "@/features/runs/api/queries";
import { useRetryRunMutation } from "@/features/runs/api/mutations";
import { RunStatusBadge } from "@/features/runs/components/run-status-badge";
import { RunTimeline } from "@/features/runs/components/run-timeline";
import { StepDrawer } from "@/features/runs/components/step-drawer";

type RunsView = { kind: "list" } | { kind: "detail"; runId: string };

const runsChartConfig = {
  succeeded: { label: "Succeeded", color: "#22c55e" },
  failed: { label: "Failed", color: "#ef4444" },
  running: { label: "Running", color: "var(--chart-1)" },
} satisfies ChartConfig;

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RunsSettingsShell() {
  const [view, setView] = useState<RunsView>({ kind: "list" });
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: workflowsData, isLoading: workflowsLoading } = useWorkflowsListQuery();
  const { data: statsData, isLoading: statsLoading } = useRunStatsByDayQuery();
  const {
    data: runsData,
    isLoading: runsLoading,
    isFetching: runsFetching,
  } = useRunsListQuery({
    workflowId,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: runDetail, isLoading: runDetailLoading } = useRunQuery(
    view.kind === "detail" ? view.runId : null,
  );
  const retryMutation = useRetryRunMutation();

  const statsChartData = statsData ?? [];
  const hasStatsData = statsChartData.length > 0;

  const runs = runsData?.items ?? [];
  const selectedStep =
    selectedStepId != null ? (runDetail?.steps.find((s) => s.id === selectedStepId) ?? null) : null;

  return (
    <div className="gap-6 max-w-2xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Run History</h1>
        <p className="text-sm text-muted-foreground">View and debug past workflow executions.</p>
      </div>
      <Separator />

      {/* Run activity bar chart — always visible */}
      <Card>
        <CardHeader>
          <CardTitle>Run activity</CardTitle>
          <CardDescription>Workflow executions over the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : !hasStatsData ? (
            <p className="text-sm py-8 text-center text-muted-foreground">
              No runs recorded in the last 30 days.
            </p>
          ) : (
            <ChartContainer config={runsChartConfig} className="h-[180px] w-full">
              <BarChart data={statsChartData} barGap={2}>
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
                  dataKey="succeeded"
                  stackId="runs"
                  fill="var(--color-succeeded)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="failed"
                  stackId="runs"
                  fill="var(--color-failed)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="running"
                  stackId="runs"
                  fill="var(--color-running)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* List view */}
      {view.kind === "list" && (
        <>
          {/* Filters */}
          <div className="gap-3 flex items-center">
            <Select
              value={workflowId ?? "__none"}
              onValueChange={(v) => {
                setWorkflowId(v === "__none" ? undefined : v);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a workflow..." />
              </SelectTrigger>
              <SelectContent>
                {workflowsLoading ? (
                  <SelectItem value="__loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  (workflowsData ?? []).map((wf: { id: string; name: string }) => (
                    <SelectItem key={wf.id} value={wf.id}>
                      {wf.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Runs list */}
          <Card>
            <CardContent className="p-0">
              {!workflowId ? (
                <p className="py-10 text-sm text-center text-muted-foreground">
                  Select a workflow above to see its run history.
                </p>
              ) : runsLoading || runsFetching ? (
                <div className="p-4 gap-3 flex flex-col">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : runs.length === 0 ? (
                <p className="py-10 text-sm text-center text-muted-foreground">
                  No runs found for the selected filters.
                </p>
              ) : (
                <ul className="divide-y">
                  {runs.map((run) => (
                    <li key={run.id}>
                      <button
                        onClick={() => setView({ kind: "detail", runId: run.id })}
                        className="px-4 py-3 text-sm w-full text-left transition-colors hover:bg-accent"
                      >
                        <div className="gap-2 flex items-center justify-between">
                          <div className="gap-2 min-w-0 flex items-center">
                            <RunStatusBadge status={run.status} />
                            <span className="font-medium truncate">{run.triggerKind}</span>
                          </div>
                          <span className="text-xs shrink-0 text-muted-foreground">
                            {formatRelativeTime(run.startedAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-mono text-muted-foreground">
                          {run.id.slice(0, 8)}&hellip;
                          {run.durationMs != null && (
                            <span className="ml-3">{formatDuration(run.durationMs)}</span>
                          )}
                          {run.cost.costCents > 0 && (
                            <span className="ml-3">${(run.cost.costCents / 100).toFixed(4)}</span>
                          )}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Detail view */}
      {view.kind === "detail" && (
        <div className="gap-4 flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 self-start"
            onClick={() => {
              setView({ kind: "list" });
              setSelectedStepId(null);
            }}
          >
            <ChevronLeft className="size-4" />
            Back to runs
          </Button>

          {runDetailLoading ? (
            <div className="gap-3 flex flex-col">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : !runDetail ? (
            <p className="text-sm text-muted-foreground">Run not found.</p>
          ) : (
            <>
              {/* Run header */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="gap-3 flex items-center justify-between">
                    <div className="gap-2 flex items-center">
                      <RunStatusBadge status={runDetail.run.status} />
                      <span className="text-sm font-medium">{runDetail.run.triggerKind}</span>
                    </div>
                    <div className="gap-2 flex items-center">
                      {workflowId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="gap-1 text-xs text-muted-foreground"
                        >
                          <a
                            href={`/workflows/${workflowId}/editor?runId=${runDetail.run.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View in editor
                            <ExternalLink className="size-3" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryMutation.mutate({ runId: runDetail.run.id })}
                        disabled={retryMutation.isPending}
                      >
                        <RefreshCw className="mr-1 size-3" />
                        Re-run
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="gap-2 text-xs flex flex-wrap text-muted-foreground">
                    <span>
                      Duration: <strong>{formatDuration(runDetail.run.durationMs)}</strong>
                    </span>
                    {runDetail.run.cost.costCents > 0 && (
                      <span>
                        Cost: <strong>${(runDetail.run.cost.costCents / 100).toFixed(4)}</strong>
                      </span>
                    )}
                    <span className="font-mono">{runDetail.run.id.slice(0, 12)}&hellip;</span>
                  </div>
                </CardContent>
              </Card>

              {/* Step timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Steps</CardTitle>
                  <CardDescription>Click a step to inspect its details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <RunTimeline
                    steps={runDetail.steps}
                    activeStepId={selectedStepId}
                    onStepClick={setSelectedStepId}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Step detail drawer */}
      <StepDrawer
        step={selectedStep ?? null}
        open={selectedStepId != null}
        onClose={() => setSelectedStepId(null)}
      />
    </div>
  );
}
