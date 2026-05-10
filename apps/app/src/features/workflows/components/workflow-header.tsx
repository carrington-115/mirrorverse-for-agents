"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  PanelLeft,
  Network,
  SquareTerminal,
  Share2,
  Save,
  Rocket,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface WorkflowHeaderProps {
  workflowName: string;
  activeTab: "builder" | "prompter";
  onTabChange: (tab: "builder" | "prompter") => void;
  onToggleMirropilot: () => void;
  isMirropilotOpen: boolean;
}

export function WorkflowHeader({
  workflowName,
  activeTab,
  onTabChange,
  onToggleMirropilot,
}: WorkflowHeaderProps) {
  const router = useRouter();

  return (
    <div className="px-3 py-2 flex shrink-0 items-center justify-between" style={{ height: 52 }}>
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

      <div className="flex items-center rounded-lg bg-accent p-[3px]">
        <button
          type="button"
          className="gap-1.5 px-2 py-1 text-sm font-medium flex min-h-[29px] items-center rounded-lg text-foreground transition-all"
          style={
            activeTab === "builder"
              ? {
                  background: "var(--background)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)",
                }
              : {}
          }
          onClick={() => onTabChange("builder")}
        >
          <Network className="size-5" />
          Builder
        </button>
        <button
          type="button"
          className="gap-1.5 px-2 py-1 text-sm font-medium flex min-h-[29px] items-center rounded-lg text-foreground transition-all"
          style={
            activeTab === "prompter"
              ? {
                  background: "var(--background)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)",
                }
              : {}
          }
          onClick={() => onTabChange("prompter")}
        >
          <SquareTerminal className="size-5" />
          Prompter
        </button>
      </div>

      <div className="gap-2 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-md"
          onClick={() => toast.info("Share coming soon")}
        >
          <Share2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-md"
          onClick={() => toast.info("Save coming soon")}
        >
          <Save className="size-4" />
        </Button>
        <Button
          variant="secondary"
          className="gap-2 h-9"
          onClick={() => toast.info("Deploy coming soon")}
        >
          <Rocket className="size-4" />
          Deploy
        </Button>
        <Button className="gap-2 h-9" onClick={() => toast.info("Run coming soon")}>
          <Play className="size-4" />
          Run
        </Button>
      </div>
    </div>
  );
}
