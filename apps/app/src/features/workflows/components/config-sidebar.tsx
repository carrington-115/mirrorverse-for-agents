"use client";

import type { ConfigSidebarType } from "@/lib/types";
import { AgentPanel } from "./panels/agent-panel";
import { TriggersPanel } from "./panels/triggers-panel";
import { ActionsPanel } from "./panels/actions-panel";

interface ConfigSidebarProps {
  type: ConfigSidebarType | null;
}

export function ConfigSidebar({ type }: ConfigSidebarProps) {
  if (!type) return null;

  return (
    <div
      className="h-full shrink-0 overflow-hidden rounded-lg border"
      style={{
        width: 364,
        background: "var(--accent-0)",
        borderColor: "var(--border-1)",
      }}
    >
      {(type === "agent" || type === "knowledge-base" || type === "tools") && <AgentPanel />}
      {(type === "triggers" || type === "trigger-settings") && <TriggersPanel />}
      {(type === "action" || type === "action-settings") && <ActionsPanel />}
      {(type === "general-tools" ||
        type === "system-tools" ||
        type === "tool-settings" ||
        type === "escalation") && (
        <div className="text-sm flex h-full items-center justify-center text-muted-foreground">
          {type} — coming soon
        </div>
      )}
    </div>
  );
}
