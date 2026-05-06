import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { KnowledgeBaseCardProps, BadgeVariant } from "@/lib/types";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  green: "bg-green-500 text-white",
  blue: "bg-blue-500 text-white",
  red: "bg-red-500 text-white",
  amber: "bg-amber-500 text-white",
};

export function KnowledgeBaseCard({
  icon,
  label,
  count,
  badgeVariant,
  onClick,
  className,
}: KnowledgeBaseCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-1 flex-col justify-between cursor-pointer",
        "rounded-2xl border border-border bg-background",
        "p-4 text-left",
        "transition-colors hover:bg-secondary/60",
        "min-w-[140px]",
        className,
      )}
    >
      {/* Top row — icon + badge */}
      <div className="flex items-start justify-between">
        <div className="text-muted-foreground">{icon}</div>
        <span
          className={cn(
            "inline-flex items-center justify-center",
            "rounded-full px-2.5 py-0.5",
            "text-xs font-semibold leading-none",
            "min-w-[28px]",
            BADGE_STYLES[badgeVariant],
          )}
        >
          {count}
        </span>
      </div>

      {/* Bottom row — label + chevron */}
      <div className="mt-6 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
