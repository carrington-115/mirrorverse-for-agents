import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkflowEditorShell } from "@/features/workflows/components/workflow-editor-shell";

export default function EditorGroupLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <WorkflowEditorShell>{children}</WorkflowEditorShell>
    </TooltipProvider>
  );
}
