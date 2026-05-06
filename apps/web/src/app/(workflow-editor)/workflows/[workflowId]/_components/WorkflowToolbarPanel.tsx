"use client";

import { useState } from "react";
import { Search, Plus, Network } from "lucide-react";
import { Input } from "@/components/ui/input";

type ToolbarTab = "all" | "triggers" | "actions" | "system";

export default function WorkflowToolbarPanel() {
  const [activeTab, setActiveTab] = useState<ToolbarTab>("all");

  const tabs: { id: ToolbarTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "triggers", label: "Triggers" },
    { id: "actions", label: "Actions" },
    { id: "system", label: "System" },
  ];

  return (
    <div
      className="h-full overflow-hidden rounded-lg border shrink-0 flex flex-col"
      style={{
        width: 364,
        background: "var(--accent-0)",
        borderColor: "var(--border-1)",
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-[var(--xs,8px)] pt-[var(--sm,12px)]">
        <div className="flex items-center gap-[var(--2xs,4px)] px-[var(--md,16px)]">
          <Network className="size-4 shrink-0 text-secondary-foreground" />
          <span className="text-sm font-medium whitespace-nowrap text-secondary-foreground">
            Workflow tools
          </span>
        </div>

        {/* Underline tabs */}
        <div className="flex items-start px-[var(--sm,12px)] border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="flex items-center justify-center min-h-[36px] px-[var(--md,16px)] py-[var(--2xs,4px)] text-xs transition-colors text-foreground font-normal"
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

      {/* Search + filters */}
      <div className="flex flex-col gap-[7px] px-[var(--md,16px)] pt-[var(--md,16px)]">
        <div className="flex items-center justify-between gap-[var(--xs,8px)]">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-[6px] top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              className="pl-7 text-xs h-8"
              placeholder="Search knowledge base"
            />
          </div>

          {/* Add integration button */}
          <button
            type="button"
            className="flex items-center gap-[6px] px-[var(--xs,8px)] py-[3px] rounded-md border text-xs font-medium shrink-0 transition-colors hover:bg-black/5 text-foreground"
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

        {/* Filter badges */}
        <div className="flex items-center gap-[5px] flex-wrap">
          {["Triggers", "Nodes and tools", "System"].map((label) => (
            <button
              key={label}
              type="button"
              className="flex items-center gap-[var(--2xs,4px)] px-[var(--xs,8px)] py-[var(--3xs,2px)] rounded-md border text-xs font-semibold transition-colors hover:bg-black/5 text-foreground border-border"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <Plus className="size-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sections — empty, content added later */}
      <div className="flex flex-col gap-[var(--2xl,32px)] flex-1 overflow-y-auto px-[var(--md,16px)] py-[var(--lg,20px)]">
        {[
          "Agentic components",
          "Triggers",
          "Nodes and tools",
          "Escalations",
        ].map((section) => (
          <div key={section} className="flex flex-col gap-[var(--xs,8px)]">
            <div className="flex items-center px-[var(--xs,8px)] py-[var(--2xs,4px)]">
              <span
                className="text-xs"
                style={{ color: "var(--unofficial-foreground-alt)" }}
              >
                {section}
              </span>
            </div>
            {/* Workflow components added here later */}
          </div>
        ))}
      </div>
    </div>
  );
}
