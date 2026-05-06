import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { DashboardCardProps } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function DashboardCard({
  title,
  icon,
  badgeNumber,
  badgeColor,
  onClick,
}: DashboardCardProps) {
  return (
    <div className="w-[144px] flex flex-col justify-between gap-[var(--sm)] border border-border rounded-lg p-[var(--xs)] h-[92px]">
      <div className="flex items-center justify-between">
        <>{icon}</>{" "}
        <Badge className={cn("rounded-full", badgeColor)}>{badgeNumber}</Badge>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm">{title}</p>
        <Button
          size={"xs"}
          variant={"ghost"}
          className="rounded-full cursor-pointer"
          onClick={onClick}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
