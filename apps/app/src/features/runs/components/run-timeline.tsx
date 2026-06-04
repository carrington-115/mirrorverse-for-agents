import type { CostBreakdown, RunStepStatus } from "@mirrorverse/types";
import { RunStatusBadge } from "./run-status-badge";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  nodeKind: string;
  status: RunStepStatus;
  durationMs: number | null;
  cost: CostBreakdown;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

const STATUS_COLOR: Record<string, string> = {
  succeeded: "bg-green-500",
  failed: "bg-red-500",
  timed_out: "bg-red-500",
  running: "bg-blue-500",
  queued: "bg-muted-foreground",
  waiting_for_input: "bg-amber-500",
  cancelled: "bg-muted-foreground",
  skipped: "bg-muted-foreground",
};

export function RunTimeline({
  steps,
  activeStepId,
  onStepClick,
}: {
  steps: Step[];
  activeStepId?: string | null;
  onStepClick: (stepId: string) => void;
}) {
  if (steps.length === 0) {
    return <p className="text-sm text-muted-foreground">No steps recorded.</p>;
  }

  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div key={step.id} className="gap-3 flex">
          {/* Left: connector + dot */}
          <div className="flex shrink-0 flex-col items-center">
            <div
              className={cn(
                "mt-1 size-2.5 shrink-0 rounded-full",
                STATUS_COLOR[step.status] ?? "bg-muted-foreground",
              )}
            />
            {i < steps.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
          </div>

          {/* Right: step info */}
          <button
            onClick={() => onStepClick(step.id)}
            className={cn(
              "mb-3 min-w-0 px-3 py-2 text-sm flex-1 rounded-md border text-left transition-colors hover:bg-accent",
              activeStepId === step.id && "border-ring bg-accent",
            )}
          >
            <div className="gap-2 flex items-center justify-between">
              <span className="font-medium truncate">{step.nodeKind}</span>
              <RunStatusBadge status={step.status} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDuration(step.durationMs)}
              {step.cost.tokensIn > 0 && (
                <span className="ml-2">
                  {(step.cost.tokensIn + step.cost.tokensOut).toLocaleString()} tokens
                </span>
              )}
            </p>
          </button>
        </div>
      ))}
    </div>
  );
}
