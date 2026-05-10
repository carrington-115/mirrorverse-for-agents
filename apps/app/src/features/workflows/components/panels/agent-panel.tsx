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

export function AgentPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [agentActivity, setAgentActivity] = useState(false);
  const [voiceConversation, setVoiceConversation] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="gap-1 px-4 pt-3 pb-2 flex shrink-0 items-center">
        <Bot className="size-6 shrink-0 text-secondary-foreground" />
        <span className="text-sm font-medium whitespace-nowrap text-secondary-foreground">
          Agent information
        </span>
      </div>

      <div className="flex shrink-0 items-start border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className="min-h-9 px-4 py-1 text-xs flex items-center justify-center whitespace-nowrap text-foreground transition-colors"
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

      <div className="px-4 py-5 flex-1 overflow-y-auto">
        {activeTab === "General" && (
          <div className="gap-2 flex flex-col">
            <div className="gap-1 flex flex-col">
              <Label className="text-sm font-medium">Name</Label>
              <Input placeholder="Agent name" />
            </div>

            <div className="gap-1 flex flex-col">
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                className="resize-y"
                style={{ minHeight: 76 }}
                placeholder="Describe what this agent does"
              />
            </div>

            <div className="gap-1 flex flex-col">
              <Label className="text-sm font-medium">Agent configuration</Label>
              <Select defaultValue="gemini-flash">
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-flash">
                    <span className="gap-2 flex items-center">
                      Gemini 3.5 flash
                      <Badge className="text-xs font-semibold px-2 py-0.5">New</Badge>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="gap-0.5 flex w-[177px] flex-col">
                <p className="text-sm font-medium text-foreground">Agent activity</p>
                <p className="text-xs leading-4 text-muted-foreground">
                  When you turn on agent activity, the superagent will actively monitor and run this
                  workflow using shared memory and tools.
                </p>
              </div>
              <Switch checked={agentActivity} onCheckedChange={setAgentActivity} />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium w-[177px] text-foreground">
                Voice conversation (optional)
              </p>
              <Switch checked={voiceConversation} onCheckedChange={setVoiceConversation} />
            </div>

            <div
              className="flex items-center justify-between transition-opacity"
              style={{ opacity: voiceConversation ? 1 : 0.4 }}
            >
              <div className="gap-0.5 flex w-[177px] flex-col">
                <p className="text-sm font-medium text-foreground">Voice configuration</p>
                <p className="text-xs leading-4 text-muted-foreground">
                  Set tone, interruption rules, and call personality for your voice agent.
                </p>
              </div>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </div>
          </div>
        )}

        {activeTab !== "General" && (
          <div className="h-32 text-sm flex items-center justify-center text-muted-foreground">
            {activeTab} — coming soon
          </div>
        )}
      </div>
    </div>
  );
}
