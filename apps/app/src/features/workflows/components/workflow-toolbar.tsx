"use client";

import { LayoutGrid, ZoomOut, ZoomIn, Maximize, Shapes, Play, ChevronDown } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function WorkflowToolbar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div
      className="p-1 flex items-center gap-[5px] rounded-sm border bg-accent"
      style={{ borderColor: "var(--border-3)" }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-md"
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        title="Fit to view"
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-md"
        onClick={() => zoomOut({ duration: 200 })}
        title="Zoom out"
      >
        <ZoomOut className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-md"
        onClick={() => zoomIn({ duration: 200 })}
        title="Zoom in"
      >
        <ZoomIn className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-md"
        onClick={() => fitView({ padding: 0.1, duration: 300 })}
        title="Full screen fit"
      >
        <Maximize className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-md"
        onClick={() => toast.info("Add nodes coming soon")}
        title="Add shapes"
      >
        <Shapes className="size-4" />
      </Button>
      <Button
        variant="secondary"
        className="h-8 gap-1 px-3 text-sm"
        onClick={() => toast.info("Run coming soon")}
      >
        <Play className="size-4" />
        Run
        <ChevronDown className="size-4" />
      </Button>
    </div>
  );
}
