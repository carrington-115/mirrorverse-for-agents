"use client";

import { useState } from "react";
import { Bot, Search, Play, PhoneOutgoing, MessageSquareText } from "lucide-react";
import { Input } from "@/components/ui/input";

const TABS = ["All", "Triggers", "Actions", "System"] as const;
type Tab = (typeof TABS)[number];

const TRIGGER_ITEMS = [
  { id: "manual", icon: Play, label: "Manual" },
  { id: "phone", icon: PhoneOutgoing, label: "Phone" },
  { id: "message", icon: MessageSquareText, label: "Message" },
  { id: "whatsapp", label: "WhatsApp", emoji: "📱" },
  { id: "messenger", label: "Messenger", emoji: "💬" },
  { id: "telegram", label: "Telegram", emoji: "✈️" },
];

type TriggerItem = typeof TRIGGER_ITEMS[number];

function TriggerTile({ item }: { item: TriggerItem }) {
  return (
    <div className="flex items-center">
      <div
        className="flex items-center justify-center rounded-l-full border p-[14px] shrink-0 bg-accent"
        style={{
          borderColor: "var(--border-3)",
          borderWidth: 0.5,
        }}
      >
        <div className="size-[14px] flex items-center justify-center">
          {"icon" in item && item.icon ? (
            <item.icon className="size-3.5 text-foreground" />
          ) : (
            <span className="text-xs">{item.emoji}</span>
          )}
        </div>
      </div>
      <div className="h-px w-6 bg-border" />
    </div>
  );
}

export default function TriggersPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("Triggers");
  const [search, setSearch] = useState("");

  const filtered = TRIGGER_ITEMS.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase())
  );

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

          {/* Triggers grid */}
          {activeTab === "Triggers" && (
            <div className="flex flex-col gap-[var(--xs,8px)]">
              <div
                className="px-[var(--xs,8px)] py-[var(--2xs,4px)] text-xs"
                style={{ color: "var(--unofficial-foreground-alt)" }}
              >
                Triggers
              </div>
              <div className="grid grid-cols-4 gap-3">
                {filtered.map((item) => (
                  <TriggerTile key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {activeTab !== "Triggers" && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              {activeTab} — coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
