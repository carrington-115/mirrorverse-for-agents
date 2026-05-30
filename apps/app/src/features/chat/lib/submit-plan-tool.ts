import type { ToolUIPart } from "ai";
import { Lightbulb, ListTodo } from "lucide-react";

import { registerTool } from "./tool-registry";

export const SUBMIT_PLAN_TOOL_TYPE = "tool-submit_plan" as const;

registerTool(SUBMIT_PLAN_TOOL_TYPE, {
  label: "Planning workflow",
  icon: ListTodo,
  beforeToolIcon: Lightbulb,
});

export type SubmitPlanToolPart = ToolUIPart & { type: typeof SUBMIT_PLAN_TOOL_TYPE };

export type WorkflowPlanKind = "automation" | "voice-agent" | "chat-agent" | "code";

export interface WorkflowPlanStep {
  readonly step: number;
  readonly description: string;
  readonly nodeType: string;
  readonly integration?: string;
}

export interface WorkflowPlanRequirement {
  readonly type: "app" | "phone" | "kb" | "mcp";
  readonly name: string;
}

export interface WorkflowPlan {
  readonly kind: WorkflowPlanKind;
  readonly title: string;
  readonly trigger: string;
  readonly steps: readonly WorkflowPlanStep[];
  readonly requirements: readonly WorkflowPlanRequirement[];
}

export interface SubmitPlanSuccess {
  readonly ok: true;
  readonly plan: WorkflowPlan;
}

export type SubmitPlanOutput = SubmitPlanSuccess | { readonly ok: false; readonly error: string };

export function isSubmitPlanPart<T extends { type: string }>(
  part: T,
): part is T & { type: typeof SUBMIT_PLAN_TOOL_TYPE } {
  return part.type === SUBMIT_PLAN_TOOL_TYPE;
}

export function readSubmitPlanOutput(part: SubmitPlanToolPart): WorkflowPlan | undefined {
  if (part.state !== "output-available") return undefined;
  const output = part.output as SubmitPlanOutput | undefined;
  if (!output || !output.ok) return undefined;
  return output.plan;
}
