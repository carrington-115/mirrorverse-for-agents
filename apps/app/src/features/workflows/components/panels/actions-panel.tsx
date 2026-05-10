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

type NodeItem = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  emoji?: string;
};

function CircleNode({ item }: { item: NodeItem }) {
  return (
    <div className="gap-1 flex flex-col items-center">
      <div
        className="flex size-[42px] items-center justify-center rounded-full border bg-accent"
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
      <div className="w-2.5 h-px bg-border" />
      <div
        className="flex size-[42px] items-center justify-center rounded-sm border bg-accent"
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

export function ActionsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("Actions");
  const [search, setSearch] = useState("");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-(--2xs,4px) px-(--md,16px) pt-(--sm,12px) pb-(--xs,8px)">
        <Bot className="size-6 shrink-0 text-secondary-foreground" />
        <span className="text-sm font-medium whitespace-nowrap text-secondary-foreground">
          Agent information
        </span>
      </div>

      <div className="flex shrink-0 items-start border-b border-border px-(--sm,12px)">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className="min-h-9 text-xs flex items-center justify-center px-(--md,16px) py-(--2xs,4px) whitespace-nowrap text-foreground"
            style={{
              borderBottom:
                activeTab === tab ? "1px solid var(--sidebar-foreground)" : "1px solid transparent",
              marginBottom: -1,
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-(--md,16px) py-(--lg,20px)">
        <div className="flex flex-col gap-(--lg,20px)">
          <div className="relative">
            <Search className="size-4 pointer-events-none absolute top-1/2 left-[6px] -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              className="pl-7 text-xs h-8"
              placeholder="Search knowledge base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {activeTab === "Actions" && (
            <div className="flex flex-col gap-(--lg,20px)">
              <div className="flex flex-col gap-(--xs,8px)">
                <div
                  className="text-xs px-(--xs,8px) py-(--2xs,4px)"
                  style={{ color: "var(--unofficial-foreground-alt)" }}
                >
                  Nodes and tools
                </div>
                <div className="gap-3 grid grid-cols-4">
                  {NODES.map((n) => (
                    <CircleNode key={n.id} item={n} />
                  ))}
                </div>
              </div>
              <div className="gap-3 grid grid-cols-4">
                {TOOLS.map((t) => (
                  <SquareTool key={t.id} item={t} />
                ))}
              </div>
            </div>
          )}

          {activeTab !== "Actions" && (
            <div className="h-32 text-sm flex items-center justify-center text-muted-foreground">
              {activeTab} — coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
