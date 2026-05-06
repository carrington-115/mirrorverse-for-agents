"use client";

import { ConfigSidebarType } from "@/lib/types";
import AgentPanel from "./panels/AgentPanel";
import TriggersPanel from "./panels/TriggersPanel";
import ActionsPanel from "./panels/ActionsPanel";

interface ConfigSidebarProps {
  type: ConfigSidebarType | null;
}

export default function ConfigSidebar({ type }: ConfigSidebarProps) {
  if (!type) return null;

  return (
    <div
      className="h-full overflow-hidden rounded-lg border shrink-0"
      style={{
        width: 364,
        background: "var(--accent-0)",
        borderColor: "var(--border-1)",
      }}
    >
      {(type === "agent" || type === "knowledge-base" || type === "tools") && <AgentPanel />}
      {(type === "triggers" || type === "trigger-settings") && <TriggersPanel />}
      {(type === "action" || type === "action-settings") && <ActionsPanel />}
      {(type === "general-tools" || type === "system-tools" || type === "tool-settings" || type === "escalation") && (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          {type} — coming soon
        </div>
      )}
    </div>
  );
}
