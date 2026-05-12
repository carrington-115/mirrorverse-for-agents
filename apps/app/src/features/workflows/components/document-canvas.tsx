"use client";

import { useMemo } from "react";
import type { Edge as RFEdge, Node as RFNode } from "@xyflow/react";

import { Canvas } from "@mirrorverse/ui/ai-elements/canvas";
import { Connection } from "@mirrorverse/ui/ai-elements/connection";
import { Edge } from "@mirrorverse/ui/ai-elements/edge";
import {
  Node,
  NodeContent,
  NodeDescription,
  NodeFooter,
  NodeHeader,
  NodeTitle,
} from "@mirrorverse/ui/ai-elements/node";
import { Controls } from "@mirrorverse/ui/ai-elements/controls";
import { cn } from "@/lib/utils";

interface DocumentNodeShape {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly position: { readonly x: number; readonly y: number };
}

interface DocumentConnectionShape {
  readonly id: string;
  readonly kind: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
}

interface DocumentCanvasProps {
  readonly nodes: readonly DocumentNodeShape[];
  readonly connections: readonly DocumentConnectionShape[];
}

interface WorkflowNodeData extends Record<string, unknown> {
  readonly label: string;
  readonly kind: string;
  readonly handles: { readonly target: boolean; readonly source: boolean };
}

const KIND_GROUP_TONE: Record<string, string> = {
  trigger: "border-l-emerald-400",
  core: "border-l-sky-400",
  ai: "border-l-violet-400",
  flow: "border-l-amber-400",
  transform: "border-l-pink-400",
  human: "border-l-orange-400",
  skill: "border-l-indigo-400",
  editor: "border-l-yellow-400",
};

function groupTone(kind: string): string {
  const group = kind.split(".")[0] ?? "core";
  return KIND_GROUP_TONE[group] ?? "border-l-border";
}

function WorkflowNode({ data }: { data: WorkflowNodeData }) {
  const [group, leaf] = data.kind.includes(".")
    ? (data.kind.split(".") as [string, string])
    : ["core", data.kind];
  return (
    <Node handles={data.handles} className={cn("border-l-4", groupTone(data.kind))}>
      <NodeHeader>
        <NodeTitle className="truncate">{data.label}</NodeTitle>
        <NodeDescription className="tracking-wide text-[10px] uppercase opacity-70">
          {group} · {leaf}
        </NodeDescription>
      </NodeHeader>
      <NodeContent>
        <p className="text-xs text-muted-foreground">{data.kind}</p>
      </NodeContent>
      <NodeFooter>
        <p className="text-[10px] text-muted-foreground/80">id: {data.label}</p>
      </NodeFooter>
    </Node>
  );
}

const nodeTypes = { workflow: WorkflowNode } as const;
const edgeTypes = { animated: Edge.Animated, temporary: Edge.Temporary } as const;

export function DocumentCanvas({ nodes, connections }: DocumentCanvasProps) {
  const incoming = useMemo(() => {
    const set = new Set<string>();
    for (const c of connections) set.add(c.toNodeId);
    return set;
  }, [connections]);

  const outgoing = useMemo(() => {
    const set = new Set<string>();
    for (const c of connections) set.add(c.fromNodeId);
    return set;
  }, [connections]);

  const rfNodes = useMemo<RFNode<WorkflowNodeData>[]>(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: "workflow",
        position: n.position,
        data: {
          label: n.name,
          kind: n.kind,
          handles: { target: incoming.has(n.id), source: outgoing.has(n.id) },
        },
      })),
    [nodes, incoming, outgoing],
  );

  const rfEdges = useMemo<RFEdge[]>(
    () =>
      connections.map((c) => ({
        id: c.id,
        source: c.fromNodeId,
        target: c.toNodeId,
        type: c.kind === "main" ? "animated" : "temporary",
      })),
    [connections],
  );

  return (
    <div className="h-full w-full">
      <Canvas
        connectionLineComponent={Connection}
        edges={rfEdges}
        edgeTypes={edgeTypes}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        maxZoom={4}
        minZoom={0.1}
        nodes={rfNodes}
        nodesConnectable={false}
        nodesDraggable={false}
        nodeTypes={nodeTypes}
      >
        <Controls />
      </Canvas>
    </div>
  );
}
