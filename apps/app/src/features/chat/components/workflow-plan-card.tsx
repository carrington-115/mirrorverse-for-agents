"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

import {
  isSubmitPlanPart,
  readSubmitPlanOutput,
  type SubmitPlanToolPart,
  type WorkflowPlanKind,
} from "@/features/chat/lib/submit-plan-tool";

const KIND_LABEL: Record<WorkflowPlanKind, string> = {
  automation: "Automation",
  "voice-agent": "Voice agent",
  "chat-agent": "Chat agent",
  code: "Code",
};

interface WorkflowPlanCardProps {
  part: SubmitPlanToolPart;
}

export function WorkflowPlanCard({ part }: WorkflowPlanCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!isSubmitPlanPart(part)) return null;

  const plan = readSubmitPlanOutput(part);
  const isLoading = part.state !== "output-available";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
      <button
        onClick={() => plan && setExpanded((v) => !v)}
        disabled={!plan}
        className="gap-2 px-3 py-2.5 flex w-full items-center text-left transition-colors hover:bg-muted/60 disabled:cursor-default disabled:hover:bg-transparent"
        aria-expanded={expanded}
      >
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin shrink-0 text-muted-foreground" />
        ) : expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground">Plan</span>
        {plan ? (
          <span className="gap-1 ml-1 flex items-center">
            <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] text-muted-foreground">
              {KIND_LABEL[plan.kind]}
            </span>
            <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] text-muted-foreground">
              {plan.steps.length} {plan.steps.length === 1 ? "step" : "steps"}
            </span>
            {plan.requirements.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] text-muted-foreground">
                {plan.requirements.length}{" "}
                {plan.requirements.length === 1 ? "requirement" : "requirements"}
              </span>
            )}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">Planning…</span>
        )}
      </button>

      {expanded && plan && (
        <div className="space-y-3 px-3 py-3 text-xs border-t border-border">
          {/* Trigger */}
          <div>
            <div className="mb-1 font-medium tracking-wide text-[10px] text-muted-foreground/60 uppercase">
              Trigger
            </div>
            <div className="text-foreground/80">{plan.trigger}</div>
          </div>

          {/* Steps */}
          {plan.steps.length > 0 && (
            <div>
              <div className="mb-1.5 font-medium tracking-wide text-[10px] text-muted-foreground/60 uppercase">
                Steps
              </div>
              <ol className="space-y-1.5">
                {plan.steps.map((step) => (
                  <li key={step.step} className="gap-2 flex items-start">
                    <span className="size-4 mt-px grid shrink-0 place-items-center rounded-full bg-muted text-[9px] text-muted-foreground">
                      {step.step}
                    </span>
                    <span className="text-foreground/80">
                      {step.description}
                      {step.integration ? (
                        <span className="ml-1 text-muted-foreground">· {step.integration}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Requirements */}
          {plan.requirements.length > 0 && (
            <div>
              <div className="mb-1.5 font-medium tracking-wide text-[10px] text-muted-foreground/60 uppercase">
                Requirements
              </div>
              <ul className="space-y-1">
                {plan.requirements.map((req, i) => (
                  <li key={i} className="gap-1.5 flex items-center text-foreground/80">
                    <span>{req.name}</span>
                    <span className="text-muted-foreground/60">({req.type})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
