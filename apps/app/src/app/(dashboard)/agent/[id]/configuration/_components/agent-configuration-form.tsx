"use client";

import { useState } from "react";
import { AudioLines, ChevronDown, ChevronUp, Gem, Globe, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const DEFAULT_DESCRIPTION = "Qualifies inbound leads, answers product questions, books demos";

const DEFAULT_SYSTEM_PROMPT = `You are a professional sales agent for Mirrroverse, an AI automation platform. Your goal is to:
1. Understand the customer's use case
2. Explain how Mirrroverse solves their problem
3. Book a demo if they're interested

Be friendly, professional, and concise.     Never make pricing commitments without approval.`;

interface AgentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  new?: boolean;
  default?: boolean;
}

const MODELS: AgentOption[] = [
  {
    value: "gemini-3.5-flash",
    label: "Gemini 3.5 flash",
    icon: <Sparkles className="size-4 text-amber-500" />,
    new: true,
  },
  {
    value: "gpt-5",
    label: "GPT-5",
    icon: <Sparkles className="size-4 text-amber-500" />,
  },
  {
    value: "claude-opus-4.7",
    label: "Claude Opus 4.7",
    icon: <Sparkles className="size-4 text-amber-500" />,
  },
];

const VOICES: AgentOption[] = [
  {
    value: "miranda",
    label: "Miranda - calm, assistive",
    icon: <AudioLines className="size-4" />,
  },
  {
    value: "max",
    label: "Max - warm, conversational",
    icon: <AudioLines className="size-4" />,
  },
  {
    value: "nova",
    label: "Nova - energetic, upbeat",
    icon: <AudioLines className="size-4" />,
  },
];

const LANGUAGES: AgentOption[] = [
  {
    value: "auto",
    label: "Auto-detect",
    icon: <Globe className="size-4" />,
    default: true,
  },
  { value: "en", label: "English", icon: <Globe className="size-4" /> },
  { value: "es", label: "Spanish", icon: <Globe className="size-4" /> },
  { value: "fr", label: "French", icon: <Globe className="size-4" /> },
];

const PERSONAS: AgentOption[] = [
  {
    value: "balanced",
    label: "Balanced & professional",
    icon: <Gem className="size-4" />,
    default: true,
  },
  {
    value: "friendly",
    label: "Friendly & casual",
    icon: <Gem className="size-4" />,
  },
  {
    value: "formal",
    label: "Formal & concise",
    icon: <Gem className="size-4" />,
  },
];

const INTERRUPTION: AgentOption[] = [
  { value: "never", label: "Never interrupt", default: true },
  { value: "polite", label: "Interrupt politely" },
  { value: "aggressive", label: "Interrupt aggressively" },
];

const END_CALL: AgentOption[] = [
  { value: "agent", label: "Agent can end call", default: true },
  { value: "user-only", label: "Only user can end call" },
];

export default function AgentConfigurationForm() {
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [model, setModel] = useState(MODELS[0].value);
  const [voice, setVoice] = useState(VOICES[0].value);
  const [language, setLanguage] = useState(LANGUAGES[0].value);
  const [persona, setPersona] = useState(PERSONAS[0].value);
  const [interruption, setInterruption] = useState(INTERRUPTION[0].value);
  const [endCall, setEndCall] = useState(END_CALL[0].value);
  const [voiceOpen, setVoiceOpen] = useState(true);

  return (
    <div className="flex w-full items-start justify-between gap-(--2xl)">
      <div className="flex w-[540px] shrink-0 flex-col gap-(--xl)">
        <Field
          id="agent-description"
          label="Agent description"
          helper="Explain what this agent does and when it should be used—helps team members understand its role."
        >
          <Textarea
            id="agent-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm min-h-[132px]"
            placeholder="Qualifies inbound leads, answers product questions, books demos"
          />
        </Field>

        <Field
          id="system-prompt"
          label="System prompt"
          helper="Explain what this agent does and when it should be used—helps team members understand its role."
        >
          <Textarea
            id="system-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="text-sm min-h-[172px] font-mono whitespace-pre-wrap"
          />
        </Field>
      </div>

      <div className="flex w-[320px] shrink-0 flex-col gap-(--md)">
        <div className="flex flex-col gap-(--2xs)">
          <Label className="text-sm font-medium text-foreground">Model</Label>
          <AgentSelect value={model} onChange={setModel} options={MODELS} />
        </div>

        <Collapsible open={voiceOpen} onOpenChange={setVoiceOpen}>
          <div className="flex flex-col gap-(--2xs)">
            <p className="text-sm font-medium text-(--foreground-alt)">
              Configure this only for communication agents
            </p>
            <div className="flex items-center justify-between">
              <div className="flex w-[177px] flex-col gap-(--3xs)">
                <p className="text-sm font-medium text-foreground">Voice configuration</p>
                <p className="text-xs leading-4 text-muted-foreground">
                  Set tone, interruption rules, and call personality for your voice agent.
                </p>
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 rounded-sm"
                  aria-label={voiceOpen ? "Collapse" : "Expand"}
                >
                  {voiceOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="mt-(--2xs) flex flex-col gap-(--xs)">
              <div className="flex flex-col gap-(--2xs)">
                <Label className="text-sm font-medium">Voice</Label>
                <AgentSelect value={voice} onChange={setVoice} options={VOICES} />
              </div>

              <div className="flex flex-col gap-(--2xs)">
                <Label className="text-sm font-medium">Language</Label>
                <AgentSelect value={language} onChange={setLanguage} options={LANGUAGES} />
              </div>

              <div className="flex flex-col gap-(--2xs)">
                <Label className="text-sm font-medium">Style &amp; persona</Label>
                <AgentSelect value={persona} onChange={setPersona} options={PERSONAS} />
              </div>

              <div className="flex flex-col gap-(--2xs)">
                <Label className="text-sm font-medium">Interruption handling</Label>
                <AgentSelect
                  value={interruption}
                  onChange={setInterruption}
                  options={INTERRUPTION}
                />
              </div>

              <div className="flex flex-col gap-(--2xs)">
                <Label className="text-sm font-medium">End call behavior</Label>
                <AgentSelect value={endCall} onChange={setEndCall} options={END_CALL} />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  helper,
  children,
}: {
  id: string;
  label: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-(--xs)">
      <div className="flex w-full flex-col gap-(--2xs)">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {children}
      </div>
      <p className="text-xs leading-4 text-muted-foreground">{helper}</p>
    </div>
  );
}

function AgentOptionRow({ option }: { option: AgentOption }) {
  return (
    <div className="min-w-0 flex flex-1 items-center gap-(--xs)">
      {option.icon}
      <span className="text-sm truncate text-foreground">{option.label}</span>
      {option.new ? (
        <Badge className="text-xs font-semibold rounded-lg px-(--xs) py-(--3xs)">New</Badge>
      ) : null}
      {option.default ? (
        <Badge className="text-xs font-semibold rounded-lg px-(--xs) py-(--3xs)">Default</Badge>
      ) : null}
    </div>
  );
}

function AgentSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: AgentOption[];
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="min-h-9 shadow-xs w-full">
        <SelectValue asChild>
          <span>{selected ? <AgentOptionRow option={selected} /> : null}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <AgentOptionRow option={o} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
