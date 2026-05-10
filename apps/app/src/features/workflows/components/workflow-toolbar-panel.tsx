"use client";

import { useState } from "react";
import { Search, Plus, Network } from "lucide-react";
import { Input } from "@/components/ui/input";

type ToolbarTab = "all" | "triggers" | "actions" | "system";

export function WorkflowToolbarPanel() {
  const [activeTab, setActiveTab] = useState<ToolbarTab>("all");

  const tabs: { id: ToolbarTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "triggers", label: "Triggers" },
    { id: "actions", label: "Actions" },
    { id: "system", label: "System" },
  ];

  return (
    <div
      className="flex h-full shrink-0 flex-col overflow-hidden rounded-lg border"
      style={{
        width: 364,
        background: "var(--accent-0)",
        borderColor: "var(--border-1)",
      }}
    >
      <div className="flex flex-col gap-(--xs,8px) pt-(--sm,12px)">
        <div className="flex items-center gap-(--2xs,4px) px-(--md,16px)">
          <Network className="size-4 shrink-0 text-secondary-foreground" />
          <span className="text-sm font-medium whitespace-nowrap text-secondary-foreground">
            Workflow tools
          </span>
        </div>

        <div className="flex items-start border-b border-border px-(--sm,12px)">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="text-xs font-normal flex min-h-[36px] items-center justify-center px-(--md,16px) py-(--2xs,4px) text-foreground transition-colors"
              style={
                activeTab === tab.id
                  ? {
                      borderBottom: "1px solid var(--sidebar-foreground)",
                      marginBottom: -1,
                    }
                  : {}
              }
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-[7px] px-(--md,16px) pt-(--md,16px)">
        <div className="flex items-center justify-between gap-(--xs,8px)">
          <div className="relative flex-1">
            <Search className="size-4 pointer-events-none absolute top-1/2 left-[6px] -translate-y-1/2 text-muted-foreground" />
            <Input type="text" className="pl-7 text-xs h-8" placeholder="Search knowledge base" />
          </div>

          <button
            type="button"
            className="text-xs font-medium hover:bg-black/5 flex shrink-0 items-center gap-[6px] rounded-md border px-(--xs,8px) py-[3px] text-foreground transition-colors"
            style={{
              background: "rgba(255,255,255,0.1)",
              borderColor: "var(--border-3)",
              boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
            }}
          >
            <Plus className="size-3" />
            Add integration
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-[5px]">
          {["Triggers", "Nodes and tools", "System"].map((label) => (
            <button
              key={label}
              type="button"
              className="text-xs font-semibold hover:bg-black/5 flex items-center gap-(--2xs,4px) rounded-md border border-border px-(--xs,8px) py-(--3xs,2px) text-foreground transition-colors"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <Plus className="size-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-(--2xl,32px) overflow-y-auto px-(--md,16px) py-(--lg,20px)">
        {["Agentic components", "Triggers", "Nodes and tools", "Escalations"].map((section) => (
          <div key={section} className="flex flex-col gap-(--xs,8px)">
            <div className="flex items-center px-(--xs,8px) py-(--2xs,4px)">
              <span className="text-xs" style={{ color: "var(--unofficial-foreground-alt)" }}>
                {section}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
