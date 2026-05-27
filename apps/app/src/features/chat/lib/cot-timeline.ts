import { isReasoningUIPart, isToolUIPart, type ToolUIPart, type UIMessage } from "ai";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BookOpen,
  Brain,
  Lightbulb,
  ListOrdered,
  ListTodo,
  Mic,
  PenLine,
  PhoneOutgoing,
  PlugZap,
  Search,
  Server,
  Sparkles,
  Workflow,
  Wrench,
} from "lucide-react";

import { KB_VIEW_TOOL_TYPE } from "./knowledge-tools";
import {
  PHONE_BYO_TOOL_TYPE,
  PHONE_PROVISION_TOOL_TYPE,
  PHONE_SEARCH_TOOL_TYPE,
  UNASSIGNED_NUMBERS_TOOL_TYPE,
  VOICE_ACTIVATE_TOOL_TYPE,
} from "./phone-tools";
import { WORKFLOW_COMMIT_TOOL_TYPE } from "./workflow-commit-tool";

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

/** Human-readable label + icon for each known tool, keyed by its UI part type. */
const TOOL_META: Record<string, { label: string; icon: LucideIcon }> = {
  [PHONE_SEARCH_TOOL_TYPE]: { label: "Searching available numbers", icon: Search },
  [PHONE_PROVISION_TOOL_TYPE]: { label: "Provisioning phone number", icon: PhoneOutgoing },
  [PHONE_BYO_TOOL_TYPE]: { label: "Connecting your Twilio number", icon: PlugZap },
  [UNASSIGNED_NUMBERS_TOOL_TYPE]: { label: "Listing your phone numbers", icon: ListOrdered },
  [VOICE_ACTIVATE_TOOL_TYPE]: { label: "Activating voice agent", icon: Mic },
  [WORKFLOW_COMMIT_TOOL_TYPE]: { label: "Building workflow", icon: Workflow },
  [KB_VIEW_TOOL_TYPE]: { label: "Reviewing knowledge base", icon: BookOpen },
  "tool-submit_plan": { label: "Planning workflow", icon: ListTodo },
  "tool-list_connected_apps": { label: "Checking connected apps", icon: PlugZap },
  "tool-list_mcp_servers": { label: "Checking MCP servers", icon: Server },
  "tool-list_app_event_catalog": { label: "Looking up app events", icon: PlugZap },
};

/**
 * Icon to show on a reasoning step based on the next tool the model will call.
 * Reasoning steps aren't tool calls themselves — they precede one — so we look
 * ahead at the upcoming tool and pick an icon that signals what the model is
 * thinking *about*. Falls back to `Brain` for unknown tools, `Sparkles` when
 * there is no following tool (model is composing its final answer).
 */
const REASONING_BEFORE_TOOL_ICON: Record<string, LucideIcon> = {
  "tool-submit_plan": Lightbulb,
  [WORKFLOW_COMMIT_TOOL_TYPE]: PenLine,
  [PHONE_SEARCH_TOOL_TYPE]: Search,
  [PHONE_PROVISION_TOOL_TYPE]: PhoneOutgoing,
  [PHONE_BYO_TOOL_TYPE]: PlugZap,
  [UNASSIGNED_NUMBERS_TOOL_TYPE]: ListOrdered,
  [VOICE_ACTIVATE_TOOL_TYPE]: Mic,
  [KB_VIEW_TOOL_TYPE]: BookOpen,
  "tool-list_connected_apps": PlugZap,
  "tool-list_mcp_servers": Server,
  "tool-list_app_event_catalog": PlugZap,
};

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
      const icon = nextTool ? (REASONING_BEFORE_TOOL_ICON[nextTool.type] ?? Brain) : Sparkles;
      steps.push({ kind: "reasoning", key, text, icon });
      continue;
    }

    if (isToolUIPart(part)) {
      // DynamicToolUIPart has type "dynamic-tool" (not tool-${string}) and won't match
      // any of our named tool types, so casting to ToolUIPart is safe here.
      const toolPart = part as ToolUIPart;
      const meta = TOOL_META[toolPart.type] ?? {
        label: humanizeToolName(toolPart.type),
        icon: Wrench,
      };
      const status = toActingStatus(toolPart.state);
      steps.push({
        kind: "acting",
        key,
        label: meta.label,
        icon: status === "error" ? AlertCircle : meta.icon,
        status,
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
