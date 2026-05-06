"use client";

import { useState } from "react";
import { ChevronDown, Bot } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const TABS = ["General", "Knowledge base", "Tools", "Advanced"] as const;
type Tab = (typeof TABS)[number];

export default function AgentPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [agentActivity, setAgentActivity] = useState(false);
  const [voiceConversation, setVoiceConversation] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-2 shrink-0">
        <Bot className="size-6 text-secondary-foreground shrink-0" />
        <span className="text-sm font-medium text-secondary-foreground whitespace-nowrap">
          Agent information
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-start border-b border-border shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className="flex items-center justify-center min-h-9 px-4 py-1 text-xs transition-colors whitespace-nowrap text-foreground"
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
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {activeTab === "General" && (
          <div className="flex flex-col gap-2">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Name</Label>
              <Input placeholder="Agent name" />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                className="resize-y"
                style={{ minHeight: 76 }}
                placeholder="Describe what this agent does"
              />
            </div>

            {/* Agent configuration */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Agent configuration</Label>
              <Select defaultValue="gemini-flash">
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-flash">
                    <span className="flex items-center gap-2">
                      Gemini 3.5 flash
                      <Badge className="text-xs font-semibold px-2 py-0.5">New</Badge>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agent activity */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5 w-[177px]">
                <p className="text-sm font-medium text-foreground">Agent activity</p>
                <p className="text-xs text-muted-foreground leading-4">
                  When you turn on agent activity, the superagent will actively monitor and run this workflow using shared memory and tools.
                </p>
              </div>
              <Switch checked={agentActivity} onCheckedChange={setAgentActivity} />
            </div>

            {/* Voice conversation */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground w-[177px]">
                Voice conversation (optional)
              </p>
              <Switch checked={voiceConversation} onCheckedChange={setVoiceConversation} />
            </div>

            {/* Voice configuration */}
            <div
              className="flex items-center justify-between transition-opacity"
              style={{ opacity: voiceConversation ? 1 : 0.4 }}
            >
              <div className="flex flex-col gap-0.5 w-[177px]">
                <p className="text-sm font-medium text-foreground">Voice configuration</p>
                <p className="text-xs text-muted-foreground leading-4">
                  Set tone, interruption rules, and call personality for your voice agent.
                </p>
              </div>
              <ChevronDown className="size-4 text-muted-foreground shrink-0" />
            </div>
          </div>
        )}

        {activeTab !== "General" && (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {activeTab} — coming soon
          </div>
        )}
      </div>
    </div>
  );
}
