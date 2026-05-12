"use client";

import { useMemo } from "react";
import type { Edge as RFEdge, Node as RFNode } from "@xyflow/react";

import { Canvas } from "@mirrorverse/ui/ai-elements/canvas";
import { Connection } from "@mirrorverse/ui/ai-elements/connection";
import { Edge } from "@mirrorverse/ui/ai-elements/edge";
import { Node, NodeDescription, NodeHeader, NodeTitle } from "@mirrorverse/ui/ai-elements/node";
import { Controls } from "@mirrorverse/ui/ai-elements/controls";

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

function WorkflowNode({ data }: { data: WorkflowNodeData }) {
  return (
    <Node handles={data.handles} className="w-56">
      <NodeHeader>
        <NodeTitle>{data.label}</NodeTitle>
        <NodeDescription>{data.kind}</NodeDescription>
      </NodeHeader>
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
    <Canvas
      connectionLineComponent={Connection}
      edges={rfEdges}
      edgeTypes={edgeTypes}
      elementsSelectable={false}
      fitView
      nodes={rfNodes}
      nodesConnectable={false}
      nodesDraggable={false}
      nodeTypes={nodeTypes}
    >
      <Controls />
    </Canvas>
  );
}
