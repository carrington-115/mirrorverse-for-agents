"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkflowHeaderProps {
  workflowName: string;
  onToggleMirropilot: () => void;
}

export function WorkflowHeader({ workflowName, onToggleMirropilot }: WorkflowHeaderProps) {
  const router = useRouter();

  return (
    <div className="px-3 py-2 flex shrink-0 items-center" style={{ height: 52 }}>
      <div className="gap-3 flex items-center">
        <div className="gap-1 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded-sm"
            onClick={() => router.push("/workflows")}
            title="Back to workflows"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded-sm"
            onClick={onToggleMirropilot}
            title="Toggle Mirropilot"
          >
            <PanelLeft className="size-4" />
          </Button>
        </div>
        <div className="gap-1 px-2 py-0.5 flex items-center rounded-md bg-secondary">
          <span className="text-xs font-semibold whitespace-nowrap text-secondary-foreground">
            {workflowName}
          </span>
        </div>
      </div>
    </div>
  );
}
