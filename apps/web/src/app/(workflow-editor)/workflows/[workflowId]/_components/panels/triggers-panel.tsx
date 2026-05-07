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

type TriggerItem = (typeof TRIGGER_ITEMS)[number];

function TriggerTile({ item }: { item: TriggerItem }) {
  return (
    <div className="flex items-center">
      <div
        className="flex shrink-0 items-center justify-center rounded-l-full border bg-accent p-[14px]"
        style={{
          borderColor: "var(--border-3)",
          borderWidth: 0.5,
        }}
      >
        <div className="flex size-[14px] items-center justify-center">
          {"icon" in item && item.icon ? (
            <item.icon className="size-3.5 text-foreground" />
          ) : (
            <span className="text-xs">{item.emoji}</span>
          )}
        </div>
      </div>
      <div className="w-6 h-px bg-border" />
    </div>
  );
}

export default function TriggersPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("Triggers");
  const [search, setSearch] = useState("");

  const filtered = TRIGGER_ITEMS.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-(--2xs,4px) px-(--md,16px) pt-(--sm,12px) pb-(--xs,8px)">
        <Bot className="size-6 shrink-0 text-secondary-foreground" />
        <span className="text-sm font-medium whitespace-nowrap text-secondary-foreground">
          Agent information
        </span>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-(--md,16px) py-(--lg,20px)">
        <div className="flex flex-col gap-(--lg,20px)">
          {/* Search */}
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

          {/* Triggers grid */}
          {activeTab === "Triggers" && (
            <div className="flex flex-col gap-(--xs,8px)">
              <div
                className="text-xs px-(--xs,8px) py-(--2xs,4px)"
                style={{ color: "var(--unofficial-foreground-alt)" }}
              >
                Triggers
              </div>
              <div className="gap-3 grid grid-cols-4">
                {filtered.map((item) => (
                  <TriggerTile key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {activeTab !== "Triggers" && (
            <div className="h-32 text-sm flex items-center justify-center text-muted-foreground">
              {activeTab} — coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
