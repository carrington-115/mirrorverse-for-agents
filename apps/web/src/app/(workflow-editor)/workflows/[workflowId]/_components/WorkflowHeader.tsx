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
  onToggleMirrropilot: () => void;
  isMirrropilotOpen: boolean;
}

export default function WorkflowHeader({
  workflowName,
  activeTab,
  onTabChange,
  onToggleMirrropilot,
}: WorkflowHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ height: 52 }}>
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
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
            onClick={onToggleMirrropilot}
            title="Toggle Mirrropilot"
          >
            <PanelLeft className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary">
          <span className="text-xs font-semibold text-secondary-foreground whitespace-nowrap">
            {workflowName}
          </span>
        </div>
      </div>

      {/* Center — tab switcher */}
      <div className="flex items-center p-[3px] rounded-lg bg-accent">
        <button
          type="button"
          className="flex items-center gap-1.5 px-2 py-1 min-h-[29px] rounded-lg text-sm font-medium transition-all text-foreground"
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
          className="flex items-center gap-1.5 px-2 py-1 min-h-[29px] rounded-lg text-sm font-medium transition-all text-foreground"
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

      {/* Right */}
      <div className="flex items-center gap-2">
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
        <Button
          className="gap-2 h-9"
          onClick={() => toast.info("Run coming soon")}
        >
          <Play className="size-4" />
          Run
        </Button>
      </div>
    </div>
  );
}
