import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RunStatus, RunStepStatus } from "@mirrorverse/types";

type AnyRunStatus = RunStatus | RunStepStatus;

const STATUS_CONFIG: Record<AnyRunStatus, { label: string; className: string; spin?: boolean }> = {
  succeeded: {
    label: "Succeeded",
    className: "bg-green-500/15 text-green-700 dark:text-green-400 border-transparent",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-transparent",
  },
  timed_out: {
    label: "Timed out",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-transparent",
  },
  running: {
    label: "Running",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-transparent",
    spin: true,
  },
  queued: {
    label: "Queued",
    className: "bg-muted text-muted-foreground border-transparent",
  },
  waiting_for_input: {
    label: "Waiting",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
    spin: true,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-transparent",
  },
  skipped: {
    label: "Skipped",
    className: "bg-muted text-muted-foreground border-transparent",
  },
};

export function RunStatusBadge({ status }: { status: AnyRunStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-transparent",
  };
  return (
    <Badge variant="outline" className={config.className}>
      {config.spin && <Loader2 className="mr-1 size-3 animate-spin" />}
      {config.label}
    </Badge>
  );
}
