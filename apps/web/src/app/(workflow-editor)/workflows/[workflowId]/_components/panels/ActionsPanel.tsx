"use client";

import { useState } from "react";
import { Bot, Search, Webhook } from "lucide-react";
import { Input } from "@/components/ui/input";

const TABS = ["All", "Triggers", "Actions", "System"] as const;
type Tab = (typeof TABS)[number];

const NODES = [
  { id: "webhook", label: "Webhook", icon: Webhook },
  { id: "slack", label: "Slack", emoji: "#" },
  { id: "notion", label: "Notion", emoji: "N" },
  { id: "zendesk", label: "Zendesk", emoji: "Z" },
  { id: "cal", label: "Cal", emoji: "📅" },
  { id: "salesforce", label: "Salesforce", emoji: "☁️" },
  { id: "pipedrive", label: "Pipedrive", emoji: "P" },
  { id: "shopify", label: "Shopify", emoji: "🛍" },
];

const TOOLS = [
  { id: "webhook-t", label: "Webhook", icon: Webhook },
  { id: "intercom", label: "Intercom", emoji: "💬" },
  { id: "pipedrive-t", label: "Pipedrive", emoji: "P" },
  { id: "stripe", label: "Stripe", emoji: "S" },
];

type NodeItem = { id: string; label: string; icon?: React.ComponentType<{ className?: string }>; emoji?: string };

function CircleNode({ item }: { item: NodeItem }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex items-center justify-center size-[42px] rounded-full border bg-accent"
        style={{
          borderColor: "var(--border-4)",
          borderWidth: 0.5,
        }}
      >
        {item.icon ? (
          <item.icon className="size-3.5 text-foreground" />
        ) : (
          <span className="text-xs font-medium">{item.emoji}</span>
        )}
      </div>
    </div>
  );
}

function SquareTool({ item }: { item: NodeItem }) {
  return (
    <div className="flex items-center">
      <div className="h-px w-2.5 bg-border" />
      <div
        className="flex items-center justify-center size-[42px] rounded-sm border bg-accent"
        style={{
          borderColor: "var(--border-3)",
          borderWidth: 0.5,
        }}
      >
        {item.icon ? (
          <item.icon className="size-3.5 text-foreground" />
        ) : (
          <span className="text-xs font-medium">{item.emoji}</span>
        )}
      </div>
    </div>
  );
}

export default function ActionsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("Actions");
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-[var(--2xs,4px)] px-[var(--md,16px)] pt-[var(--sm,12px)] pb-[var(--xs,8px)] shrink-0">
        <Bot className="size-6 text-secondary-foreground shrink-0" />
        <span className="text-sm font-medium text-secondary-foreground whitespace-nowrap">
          Agent information
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-start border-b border-border px-[var(--sm,12px)] shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className="flex items-center justify-center min-h-9 px-[var(--md,16px)] py-[var(--2xs,4px)] text-xs whitespace-nowrap text-foreground"
            style={{
              borderBottom: activeTab === tab ? "1px solid var(--sidebar-foreground)" : "1px solid transparent",
              marginBottom: -1,
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-[var(--md,16px)] py-[var(--lg,20px)]">
        <div className="flex flex-col gap-[var(--lg,20px)]">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-[6px] top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              className="pl-7 text-xs h-8"
              placeholder="Search knowledge base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {activeTab === "Actions" && (
            <div className="flex flex-col gap-[var(--lg,20px)]">
              {/* Nodes */}
              <div className="flex flex-col gap-[var(--xs,8px)]">
                <div
                  className="px-[var(--xs,8px)] py-[var(--2xs,4px)] text-xs"
                  style={{ color: "var(--unofficial-foreground-alt)" }}
                >
                  Nodes and tools
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {NODES.map((n) => (
                    <CircleNode key={n.id} item={n} />
                  ))}
                </div>
              </div>
              {/* Tools */}
              <div className="grid grid-cols-4 gap-3">
                {TOOLS.map((t) => (
                  <SquareTool key={t.id} item={t} />
                ))}
              </div>
            </div>
          )}

          {activeTab !== "Actions" && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              {activeTab} — coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
