"use client";

import { Handle, Position } from "@xyflow/react";

export type DocumentNodeData = {
  label: string;
  kind: string;
  [key: string]: unknown;
};

const KIND_GROUP_COLOR: Record<string, string> = {
  trigger: "bg-emerald-50 text-emerald-900 border-emerald-200",
  core: "bg-sky-50 text-sky-900 border-sky-200",
  ai: "bg-violet-50 text-violet-900 border-violet-200",
  flow: "bg-amber-50 text-amber-900 border-amber-200",
  transform: "bg-pink-50 text-pink-900 border-pink-200",
  human: "bg-orange-50 text-orange-900 border-orange-200",
  skill: "bg-indigo-50 text-indigo-900 border-indigo-200",
  editor: "bg-yellow-50 text-yellow-900 border-yellow-200",
};

function groupColor(kind: string): string {
  const group = kind.split(".")[0] ?? "core";
  return KIND_GROUP_COLOR[group] ?? "bg-card text-foreground border-border";
}

export function DocumentNode({ data }: { data: DocumentNodeData }) {
  const colorClasses = groupColor(data.kind);
  return (
    <div className={`px-3 py-2 shadow-sm min-w-[180px] rounded-xl border ${colorClasses}`}>
      <Handle type="target" position={Position.Left} className="bg-current!" />
      <div className="tracking-wide text-[10px] uppercase opacity-70">{data.kind}</div>
      <div className="text-sm font-medium truncate">{data.label}</div>
      <Handle type="source" position={Position.Right} className="bg-current!" />
    </div>
  );
}
