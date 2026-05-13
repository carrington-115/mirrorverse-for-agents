export type ModelOption = {
  readonly id: string;
  readonly name: string;
  readonly chef: string;
  readonly chefSlug: string;
};

export const CHAT_MODELS = [
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", chef: "Anthropic", chefSlug: "anthropic" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", chef: "Anthropic", chefSlug: "anthropic" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", chef: "Anthropic", chefSlug: "anthropic" },
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", chef: "Anthropic", chefSlug: "anthropic" },
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", chef: "Anthropic", chefSlug: "anthropic" },
  { id: "claude-opus-4-7", name: "Claude Opus 4.7", chef: "Anthropic", chefSlug: "anthropic" },
] as const satisfies readonly ModelOption[];

export const DEFAULT_CHAT_MODEL: ModelOption["id"] = CHAT_MODELS[0].id;

export type ChatStarter = {
  readonly title: string;
  readonly prompt: string;
};

export const CHAT_STARTERS = [
  {
    title: "Lead Qualification Agent",
    prompt:
      "Qualifies inbound leads from any channel, asks discovery questions, books meetings via Calendly, and updates Salesforce automatically.",
  },
  {
    title: "Expense Approval bots",
    prompt:
      "Processes employee expense requests, verifies receipts, checks policy limits, approves small amounts or escalates to finance.",
  },
  {
    title: "HR assistant",
    prompt:
      "Guides new hires through paperwork, benefits questions, and team intros while creating tasks in Asana and notifying HR.",
  },
] as const satisfies readonly ChatStarter[];

export type WorkflowKind = "automation" | "voice-agent" | "chat-agent" | "code";

export const WORKFLOW_KIND_LABEL: Record<WorkflowKind, string> = {
  automation: "Automation",
  "voice-agent": "Voice agent",
  "chat-agent": "Chat agent",
  code: "Code",
};
