import { isReasoningUIPart, isToolUIPart, type ToolUIPart, type UIMessage } from "ai";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Brain, PlugZap, Server, Sparkles, Wrench } from "lucide-react";

// Trigger side-effect registrations so the registry is populated before
// buildCotTimeline is called. Each lib module calls registerTool on import.
import "./knowledge-tools";
import "./phone-tools";
import { SUBMIT_PLAN_TOOL_TYPE } from "./submit-plan-tool";
import "./workflow-commit-tool";
import { getToolMeta, registerTool } from "./tool-registry";

// Infrastructure tools that appear in the COT timeline but have no UI card.
registerTool("tool-list_connected_apps", { label: "Checking connected apps", icon: PlugZap });
registerTool("tool-list_integration_tools", { label: "Looking up app tools", icon: PlugZap });
registerTool("tool-list_mcp_servers", { label: "Checking MCP servers", icon: Server });
registerTool("tool-list_app_event_catalog", { label: "Looking up app events", icon: PlugZap });

/**
 * The chain-of-thought timeline is a single chronological stream of the
 * assistant's *reasoning* (model thinking + builder narration, both arrive as
 * `reasoning` parts) interleaved with its *acting* steps (tool calls). It is
 * derived purely from `message.parts`, which the AI SDK appends in arrival
 * order across every step of a turn. The rich, interactive tool cards still
 * render separately in the message body — these acting steps are the compact
 * "what is it doing right now" view.
 */

export type ActingStatus = "active" | "complete" | "error";

export type CotStep =
  | {
      readonly kind: "reasoning";
      readonly key: string;
      readonly text: string;
      readonly icon: LucideIcon;
    }
  | {
      readonly kind: "acting";
      readonly key: string;
      readonly label: string;
      readonly icon: LucideIcon;
      readonly status: ActingStatus;
      readonly part: ToolUIPart;
    };

export type CotPhase = "thinking" | "working" | "done";

/**
 * Resolve the icon to show on a reasoning step that precedes `toolType`.
 * Uses `beforeToolIcon` from the registry when set, falls back to the tool's
 * regular icon, then to `Brain` for unregistered tools. Returns `Sparkles`
 * when there is no following tool (model is composing its final answer).
 */
function reasoningIcon(toolType: string | undefined): LucideIcon {
  if (!toolType) return Sparkles;
  const meta = getToolMeta(toolType);
  return meta?.beforeToolIcon ?? meta?.icon ?? Brain;
}

/** Fallback label for a tool we don't have explicit copy for (e.g. future tools). */
function humanizeToolName(type: string): string {
  const name = type.startsWith("tool-") ? type.slice("tool-".length) : type;
  const spaced = name.replace(/_/g, " ").trim();
  if (!spaced) return "Working";
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function toActingStatus(state: string): ActingStatus {
  if (state === "output-error") return "error";
  if (state === "output-available") return "complete";
  // input-streaming | input-available — the tool is still being called/run.
  return "active";
}

/**
 * Walks a message's parts and produces the ordered timeline of reasoning and
 * acting steps. Text parts (the visible answer) and `step-start` boundaries are
 * skipped — neither type-guard matches them — so they never become steps.
 *
 * Reasoning steps use a look-ahead: scan forward in `parts` to find the next
 * tool call and pick an icon that signals what the model is thinking about.
 * If no tool follows (the model is composing its answer) `Sparkles` is used.
 */
export function buildCotTimeline(message: UIMessage): { steps: CotStep[]; hasAny: boolean } {
  const steps: CotStep[] = [];
  const parts = message.parts;

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    const key = `${message.id}-cot-${index}`;

    if (isReasoningUIPart(part)) {
      const text = part.text.trim();
      if (!text) continue;
      const nextTool = parts.slice(index + 1).find(isToolUIPart);
      const icon = reasoningIcon(nextTool?.type);
      steps.push({ kind: "reasoning", key, text, icon });
      continue;
    }

    if (isToolUIPart(part)) {
      // DynamicToolUIPart has type "dynamic-tool" (not tool-${string}) and won't match
      // any of our named tool types, so casting to ToolUIPart is safe here.
      const toolPart = part as ToolUIPart;
      const meta = getToolMeta(toolPart.type) ?? {
        label: humanizeToolName(toolPart.type),
        icon: Wrench,
      };
      const status = toActingStatus(toolPart.state);
      let label = meta.label;
      let icon = status === "error" ? AlertCircle : meta.icon;
      let actingStatus: ActingStatus = status;

      // Plans fail silently and auto-retry; don't expose the error to the user
      if (toolPart.type === SUBMIT_PLAN_TOOL_TYPE && status === "error") {
        label = "Retrying to create plan";
        icon = meta.icon;
        actingStatus = "complete";
      }

      steps.push({
        kind: "acting",
        key,
        label,
        icon,
        status: actingStatus,
        part: toolPart,
      });
    }
  }

  return { steps, hasAny: steps.length > 0 };
}

/**
 * Whether the assistant is currently reasoning, acting, or finished — used to
 * label the panel header. Only a live (last + streaming) message can be
 * "thinking"/"working"; everything else is "done".
 */
export function deriveCotPhase(message: UIMessage, isLive: boolean): CotPhase {
  if (!isLive) return "done";
  // Find the most recent reasoning or tool part; a streaming answer (text) is
  // characterized by whatever immediately preceded it.
  for (let i = message.parts.length - 1; i >= 0; i--) {
    const part = message.parts[i];
    if (isToolUIPart(part)) return "working";
    if (isReasoningUIPart(part)) return "thinking";
  }
  return "thinking";
}
