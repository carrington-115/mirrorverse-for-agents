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
    <div className="flex h-[92px] w-[144px] flex-col justify-between gap-(--sm) rounded-lg border border-border p-(--xs)">
      <div className="flex items-center justify-between">
        <>{icon}</> <Badge className={cn("rounded-full", badgeColor)}>{badgeNumber}</Badge>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm">{title}</p>
        <Button
          size={"xs"}
          variant={"ghost"}
          className="cursor-pointer rounded-full"
          onClick={onClick}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
