import { cn } from "@/lib/utils";
import { AgentStatus } from "@/lib/types";

const statusConfig: Record<AgentStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-600 text-white" },
  paused: { label: "Paused", className: "bg-yellow-500 text-white" },
  inactive: { label: "Inactive", className: "bg-neutral-300 text-neutral-700" },
};

export default function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const { label, className } = statusConfig[status];
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-xs font-medium inline-flex items-center rounded-lg",
        className,
      )}
    >
      {label}
    </span>
  );
}
