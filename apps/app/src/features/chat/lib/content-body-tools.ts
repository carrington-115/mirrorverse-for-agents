import type { ToolUIPart } from "ai";
import { FileText } from "lucide-react";

import { registerTool } from "./tool-registry";

export const CONTENT_BODY_TOOL_TYPE = "tool-request_content_body" as const;

registerTool(CONTENT_BODY_TOOL_TYPE, { label: "Preparing content editor", icon: FileText });

export type ContentBodyToolPart = ToolUIPart & { type: typeof CONTENT_BODY_TOOL_TYPE };

export type ContentBodyContentType = "email" | "slack" | "sms" | "generic";

export interface ContentBodyOutput {
  readonly ok: boolean;
  readonly contentType: ContentBodyContentType;
  readonly description: string;
  readonly suggestedSubject?: string;
  readonly suggestedBody?: string;
}

export function isContentBodyPart<T extends { type: string }>(
  part: T,
): part is T & { type: typeof CONTENT_BODY_TOOL_TYPE } {
  return part.type === CONTENT_BODY_TOOL_TYPE;
}

export function readContentBodyOutput(part: ContentBodyToolPart): ContentBodyOutput | undefined {
  if (part.state !== "output-available") return undefined;
  return part.output as ContentBodyOutput;
}
