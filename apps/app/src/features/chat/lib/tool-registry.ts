import type { LucideIcon } from "lucide-react";

export interface ToolMeta {
  readonly label: string;
  readonly icon: LucideIcon;
  /** Icon shown on the reasoning step that immediately precedes this tool call.
   * Falls back to `icon` when not set. */
  readonly beforeToolIcon?: LucideIcon;
}

const registry = new Map<string, ToolMeta>();

export function registerTool(type: string, meta: ToolMeta): void {
  registry.set(type, meta);
}

export function getToolMeta(type: string): ToolMeta | undefined {
  return registry.get(type);
}
