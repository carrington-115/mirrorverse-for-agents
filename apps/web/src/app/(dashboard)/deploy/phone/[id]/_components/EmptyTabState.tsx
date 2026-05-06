"use client";

import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { toast } from "sonner";

interface EmptyTabStateProps {
  title: string;
  description: string;
}

export default function EmptyTabState({ title, description }: EmptyTabStateProps) {
  return (
    <div className="flex w-full items-center justify-center py-4">
      <div className="border border-border rounded-xl w-[448px] min-h-[277px] px-8 py-8 flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col gap-1 text-center">
          <p className="text-base font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => toast.info("Test run coming soon")}
            className="gap-1.5"
          >
            <Activity className="size-3.5" />
            Run test
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info("Edit coming soon")}
          >
            Edit details
          </Button>
        </div>
      </div>
    </div>
  );
}
