"use client";

import {
  Bot,
  Check,
  Clock,
  Code2,
  Database,
  Mic,
  Phone,
  PlugZap,
  Server,
  Workflow,
  Zap,
} from "lucide-react";

import {
  isSubmitPlanPart,
  readSubmitPlanOutput,
  type SubmitPlanToolPart,
  type WorkflowPlanKind,
  type WorkflowPlanRequirement,
} from "@/features/chat/lib/submit-plan-tool";

const KIND_CONFIG: Record<
  WorkflowPlanKind,
  { label: string; icon: React.ElementType; color: string }
> = {
  automation: {
    label: "Automation",
    icon: Zap,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  "voice-agent": {
    label: "Voice agent",
    icon: Mic,
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  "chat-agent": {
    label: "Chat agent",
    icon: Bot,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  code: {
    label: "Code",
    icon: Code2,
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
};

const REQUIREMENT_CONFIG: Record<
  WorkflowPlanRequirement["type"],
  { icon: React.ElementType; label: string }
> = {
  app: { icon: PlugZap, label: "App connection" },
  phone: { icon: Phone, label: "Phone number" },
  kb: { icon: Database, label: "Knowledge base" },
  mcp: { icon: Server, label: "MCP server" },
};

function NodeTypeChip({ nodeType }: { nodeType: string }) {
  return (
    <span className="px-1.5 py-0.5 inline-flex items-center rounded-sm border border-border/50 bg-muted font-mono text-[10px] text-muted-foreground">
      {nodeType}
    </span>
  );
}

interface WorkflowPlanCardProps {
  part: SubmitPlanToolPart;
}

export function WorkflowPlanCard({ part }: WorkflowPlanCardProps) {
  if (!isSubmitPlanPart(part)) return null;

  const plan = readSubmitPlanOutput(part);
  const isLoading = part.state !== "output-available";

  if (isLoading) {
    return (
      <div className="my-3 p-4 rounded-2xl border border-border bg-card">
        <div className="gap-2 flex items-center">
          <div className="size-9 animate-pulse shrink-0 rounded-xl bg-muted" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-32 animate-pulse rounded-sm bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded-sm bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const kindCfg = KIND_CONFIG[plan.kind];
  const KindIcon = kindCfg.icon;

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="gap-3 p-4 flex items-center border-b border-border/60">
        <div className={`size-9 grid shrink-0 place-items-center rounded-xl ${kindCfg.color}`}>
          <KindIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate text-foreground">{plan.title}</div>
          <div className="gap-1.5 text-xs flex items-center text-muted-foreground">
            <span className={`font-medium ${kindCfg.color.split(" ")[1]}`}>{kindCfg.label}</span>
          </div>
        </div>
        <div className="gap-1 text-xs flex shrink-0 items-center text-muted-foreground">
          <Workflow className="size-3" />
          <span>Plan</span>
        </div>
      </div>

      {/* Trigger */}
      <div className="gap-2 px-4 py-3 flex items-start border-b border-border/60">
        <div className="mt-0.5 shrink-0">
          <Clock className="size-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="font-medium tracking-wide text-[11px] text-muted-foreground uppercase">
            Trigger
          </div>
          <div className="text-sm text-foreground">{plan.trigger}</div>
        </div>
      </div>

      {/* Steps */}
      {plan.steps.length > 0 && (
        <div className="px-4 py-3 border-b border-border/60">
          <div className="mb-2 font-medium tracking-wide text-[11px] text-muted-foreground uppercase">
            Steps
          </div>
          <ol className="space-y-2">
            {plan.steps.map((step) => (
              <li key={step.step} className="gap-2.5 flex items-start">
                <span className="mt-0.5 size-5 font-medium grid shrink-0 place-items-center rounded-full bg-muted text-[10px] text-muted-foreground">
                  {step.step}
                </span>
                <div className="min-w-0 pt-0.5 flex-1">
                  <div className="gap-1.5 flex flex-wrap items-center">
                    <span className="text-sm text-foreground">{step.description}</span>
                    {step.integration && (
                      <span className="gap-0.5 px-1.5 py-0.5 font-medium inline-flex items-center rounded-sm bg-primary/8 text-[10px] text-primary">
                        <PlugZap className="size-2.5" />
                        {step.integration}
                      </span>
                    )}
                  </div>
                  <NodeTypeChip nodeType={step.nodeType} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Requirements */}
      {plan.requirements.length > 0 && (
        <div className="px-4 py-3">
          <div className="mb-2 font-medium tracking-wide text-[11px] text-muted-foreground uppercase">
            Requirements
          </div>
          <ul className="space-y-1.5">
            {plan.requirements.map((req, i) => {
              const cfg = REQUIREMENT_CONFIG[req.type];
              const Icon = cfg.icon;
              return (
                <li key={i} className="gap-2 text-sm flex items-center text-muted-foreground">
                  <Icon className="size-3.5 shrink-0" />
                  <span>{req.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/60">
                    {cfg.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="gap-1.5 px-4 py-2.5 flex items-center border-t border-border/60 bg-muted/30">
        <Check className="size-3 text-green-500" />
        <span className="text-xs text-muted-foreground">
          Plan ready — gathering requirements next
        </span>
      </div>
    </div>
  );
}
