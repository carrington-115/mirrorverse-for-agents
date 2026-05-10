"use client";

import { Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface EmptyTabStateProps {
  title: string;
  description: string;
}

export function EmptyTabState({ title, description }: EmptyTabStateProps) {
  return (
    <div className="py-4 flex w-full items-center justify-center">
      <div className="px-8 py-8 gap-4 flex min-h-[277px] w-[448px] flex-col items-center justify-center rounded-xl border border-border">
        <div className="gap-1 flex flex-col text-center">
          <p className="text-base font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="gap-2 flex items-center">
          <Button size="sm" onClick={() => toast.info("Test run coming soon")} className="gap-1.5">
            <Activity className="size-3.5" />
            Run test
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.info("Edit coming soon")}>
            Edit details
          </Button>
        </div>
      </div>
    </div>
  );
}
