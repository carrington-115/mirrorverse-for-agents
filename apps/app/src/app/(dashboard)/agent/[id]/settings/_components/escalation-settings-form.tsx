"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { AgentEscalationSettings } from "@/lib/types";

interface EscalationSettingsFormProps {
  initial: AgentEscalationSettings;
}

type ScenarioKey = keyof AgentEscalationSettings["scenarios"];
type DestinationKey = keyof AgentEscalationSettings["destinations"];
type HandoffKey = keyof AgentEscalationSettings["handoff"];

const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "userRequestsHuman", label: "User explicitly requests human" },
  { key: "negativeSentiment", label: "Negative sentiment detected" },
  { key: "agentStuck", label: "Agent stuck" },
  { key: "toolCallFails", label: "Tool call fails repeatedly" },
  { key: "maxLengthExceeded", label: "Conversation exceeds max length" },
];

const DESTINATIONS: { key: DestinationKey; label: string }[] = [
  { key: "slack", label: "Slack" },
  { key: "zendesk", label: "Zendesk" },
  { key: "phoneTransfer", label: "Phone transfer" },
];

const HANDOFF: { key: HandoffKey; label: string }[] = [
  { key: "includeTranscript", label: "Include full transcript" },
  { key: "includeCustomerInfo", label: "Include customer info" },
  { key: "includeSummary", label: "Include summary" },
];

export default function EscalationSettingsForm({ initial }: EscalationSettingsFormProps) {
  const [settings, setSettings] = useState(initial);

  return (
    <div className="flex w-full flex-col gap-(--xl)">
      <h2 className="font-semibold text-(length:--heading-4-font-size) leading-(--heading-4-line-height) text-foreground">
        Escalation configuration
      </h2>

      <Row
        title="Escalation scenario"
        description="Configure the escalation scenarios so you give your agent more context when to escalate to an agent or human."
      >
        {SCENARIOS.map(({ key, label }) => (
          <Toggle
            key={key}
            label={label}
            checked={settings.scenarios[key]}
            onChange={(v) =>
              setSettings((s) => ({
                ...s,
                scenarios: { ...s.scenarios, [key]: v },
              }))
            }
          />
        ))}
      </Row>

      <Row
        title="Escalation destination"
        description="Configure the escalation destination so you route handoffs to the right channel or team."
      >
        {DESTINATIONS.map(({ key, label }) => (
          <Toggle
            key={key}
            label={label}
            checked={settings.destinations[key]}
            onChange={(v) =>
              setSettings((s) => ({
                ...s,
                destinations: { ...s.destinations, [key]: v },
              }))
            }
          />
        ))}
      </Row>

      <Row
        title="Handoff context"
        description="Configure the handoff context so you give the receiving agent or human enough information to continue the conversation."
      >
        {HANDOFF.map(({ key, label }) => (
          <Toggle
            key={key}
            label={label}
            checked={settings.handoff[key]}
            onChange={(v) =>
              setSettings((s) => ({
                ...s,
                handoff: { ...s.handoff, [key]: v },
              }))
            }
          />
        ))}
      </Row>
    </div>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-(--2xl)">
      <div className="flex flex-col gap-(--2xs)">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs max-w-[340px] leading-(--paragraph-small-line-height) text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex flex-col gap-(--sm)">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="text-sm flex cursor-pointer items-center gap-(--xs) text-foreground select-none">
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
      {label}
    </label>
  );
}
