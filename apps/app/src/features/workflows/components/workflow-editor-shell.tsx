import type { ReactNode } from "react";

export function WorkflowEditorShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">{children}</div>
  );
}
