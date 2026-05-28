import type { CSSProperties } from "react";

export interface HandleDef {
  readonly id: string;
  readonly type: "source" | "target";
  readonly position: "Left" | "Right" | "Top" | "Bottom";
  readonly connectionKind: string;
  readonly label: string;
  readonly style?: CSSProperties;
}

// Colors used for AI slot edges and handle dots, keyed by connectionKind.
export const AI_SLOT_COLORS: Record<string, string> = {
  ai_languageModel: "var(--color-violet-500)",
  ai_memory: "var(--color-sky-500)",
  ai_tool: "var(--color-amber-500)",
  ai_retriever: "var(--color-emerald-500)",
  ai_outputParser: "var(--color-rose-500)",
  ai_chain: "var(--color-orange-500)",
  voice: "var(--color-pink-500)",
};

const MAIN_IN: HandleDef = {
  id: "main-in",
  type: "target",
  position: "Left",
  connectionKind: "main",
  label: "Input",
};
const MAIN_OUT: HandleDef = {
  id: "main-out",
  type: "source",
  position: "Right",
  connectionKind: "main",
  label: "Output",
};

const AGENT_BOTTOM_HANDLES: readonly HandleDef[] = [
  {
    id: "ai_languageModel-in",
    type: "target",
    position: "Bottom",
    connectionKind: "ai_languageModel",
    label: "Model",
    style: { left: "20%" },
  },
  {
    id: "ai_memory-in",
    type: "target",
    position: "Bottom",
    connectionKind: "ai_memory",
    label: "Memory",
    style: { left: "40%" },
  },
  {
    id: "ai_tool-in",
    type: "target",
    position: "Bottom",
    connectionKind: "ai_tool",
    label: "Tools",
    style: { left: "60%" },
  },
  {
    id: "ai_retriever-in",
    type: "target",
    position: "Bottom",
    connectionKind: "ai_retriever",
    label: "KB",
    style: { left: "80%" },
  },
];

export function getHandlesForKind(kind: string): readonly HandleDef[] {
  switch (kind) {
    case "trigger.manual":
    case "trigger.cron":
    case "trigger.webhook":
    case "trigger.app_event":
    case "trigger.inbound_call":
      return [MAIN_OUT];

    case "flow.stop":
      return [MAIN_IN];

    case "ai.agent":
      return [MAIN_IN, MAIN_OUT, ...AGENT_BOTTOM_HANDLES];

    case "ai.voice_agent":
      return [MAIN_IN, MAIN_OUT];

    case "ai.language_model":
      return [
        {
          id: "ai_languageModel-out",
          type: "source",
          position: "Top",
          connectionKind: "ai_languageModel",
          label: "Model",
        },
      ];

    case "ai.memory":
      return [
        {
          id: "ai_memory-out",
          type: "source",
          position: "Top",
          connectionKind: "ai_memory",
          label: "Memory",
        },
      ];

    case "ai.retriever":
      return [
        {
          id: "ai_retriever-out",
          type: "source",
          position: "Top",
          connectionKind: "ai_retriever",
          label: "KB",
        },
      ];

    case "ai.output_parser":
      return [
        {
          id: "ai_outputParser-out",
          type: "source",
          position: "Top",
          connectionKind: "ai_outputParser",
          label: "Parser",
        },
      ];

    case "editor.sticky_note":
      return [];

    default:
      return [MAIN_IN, MAIN_OUT];
  }
}

export function connectionKindFromHandleId(handleId: string | null | undefined): string {
  if (!handleId) return "main";
  if (handleId.startsWith("ai_")) return handleId.replace(/-in$|-out$/, "");
  if (handleId.startsWith("voice")) return "voice";
  return "main";
}

export function edgeTypeForKind(kind: string): string {
  if (kind === "main") return "animated";
  return "aiSlot";
}

export function edgeColorForKind(kind: string): string | undefined {
  return AI_SLOT_COLORS[kind];
}
