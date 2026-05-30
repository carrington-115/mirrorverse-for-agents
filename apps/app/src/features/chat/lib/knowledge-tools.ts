import type { ToolUIPart } from "ai";
import { BookOpen } from "lucide-react";

import { registerTool } from "./tool-registry";

export const KB_VIEW_TOOL_TYPE = "tool-view_knowledge_bases" as const;

registerTool(KB_VIEW_TOOL_TYPE, { label: "Reviewing knowledge base", icon: BookOpen });

export type KbViewToolPart = ToolUIPart & { type: typeof KB_VIEW_TOOL_TYPE };

export interface KbViewOutput {
  readonly ok: boolean;
  readonly chatSessionId: string | null;
  readonly query: string | null;
  readonly documentId: string | null;
}

export function isKbViewPart<T extends { type: string }>(
  part: T,
): part is T & { type: typeof KB_VIEW_TOOL_TYPE } {
  return part.type === KB_VIEW_TOOL_TYPE;
}

export function readKbViewOutput(part: KbViewToolPart): KbViewOutput | undefined {
  if (part.state !== "output-available") return undefined;
  return part.output as KbViewOutput;
}
