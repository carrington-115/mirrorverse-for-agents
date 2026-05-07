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
        "group flex flex-1 cursor-pointer flex-col justify-between",
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
            "px-2.5 py-0.5 rounded-full",
            "text-xs font-semibold leading-none",
            "min-w-[28px]",
            BADGE_STYLES[badgeVariant],
          )}
        >
          {count}
        </span>
      </div>

      {/* Bottom row — label + chevron */}
      <div className="mt-6 gap-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <ChevronRight className="size-4 group-hover:translate-x-0.5 shrink-0 text-muted-foreground transition-transform" />
      </div>
    </button>
  );
}
