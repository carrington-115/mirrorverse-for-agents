"use client";

import { useCallback, useMemo } from "react";
import type {
  Connection as RFConnection,
  Edge as RFEdge,
  EdgeChange,
  Node as RFNode,
  NodeChange,
} from "@xyflow/react";

import { Canvas } from "@mirrorverse/ui/ai-elements/canvas";
import { Connection } from "@mirrorverse/ui/ai-elements/connection";
import { Edge } from "@mirrorverse/ui/ai-elements/edge";
import { Node, NodeDescription, NodeHeader, NodeTitle } from "@mirrorverse/ui/ai-elements/node";
import { Controls } from "@mirrorverse/ui/ai-elements/controls";

import { NodeIcon, type NodeIconHints } from "@/features/workflows/lib/node-icon";

interface DocumentNodeShape {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly hints?: NodeIconHints;
}

interface DocumentConnectionShape {
  readonly id: string;
  readonly kind: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
}

export interface CanvasNodeChange {
  readonly id: string;
  readonly position: { readonly x: number; readonly y: number };
}

export interface CanvasNewConnection {
  readonly fromNodeId: string;
  readonly toNodeId: string;
}

interface DocumentCanvasProps {
  readonly nodes: readonly DocumentNodeShape[];
  readonly connections: readonly DocumentConnectionShape[];
  readonly editable?: boolean;
  readonly showControls?: boolean;
  readonly onNodePositionChange?: (change: CanvasNodeChange) => void;
  readonly onNodeRemoved?: (id: string) => void;
  readonly onConnectionRemoved?: (id: string) => void;
  readonly onConnectionAdded?: (link: CanvasNewConnection) => void;
}

interface WorkflowNodeData extends Record<string, unknown> {
  readonly label: string;
  readonly kind: string;
  readonly hints?: NodeIconHints;
  readonly handles: { readonly target: boolean; readonly source: boolean };
}

function WorkflowNode({ data }: { data: WorkflowNodeData }) {
  return (
    <Node handles={data.handles} className="w-60">
      <NodeHeader>
        <div className="gap-2.5 min-w-0 flex w-full items-start">
          <NodeIcon kind={data.kind} hints={data.hints} />
          <div className="min-w-0 flex flex-1 flex-col">
            <NodeTitle>{data.label}</NodeTitle>
            <NodeDescription>{data.kind}</NodeDescription>
          </div>
        </div>
      </NodeHeader>
    </Node>
  );
}

const nodeTypes = { workflow: WorkflowNode } as const;
const edgeTypes = { animated: Edge.Animated, temporary: Edge.Temporary } as const;

export function DocumentCanvas({
  nodes,
  connections,
  editable = false,
  showControls = true,
  onNodePositionChange,
  onNodeRemoved,
  onConnectionRemoved,
  onConnectionAdded,
}: DocumentCanvasProps) {
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

  // When editable, every node renders both handles so the user can wire from
  // anywhere. In read-only mode we only render handles for endpoints that are
  // already connected.
  const rfNodes = useMemo<RFNode<WorkflowNodeData>[]>(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: "workflow",
        position: n.position,
        data: {
          label: n.name,
          kind: n.kind,
          hints: n.hints,
          handles: editable
            ? { target: true, source: true }
            : { target: incoming.has(n.id), source: outgoing.has(n.id) },
        },
      })),
    [nodes, incoming, outgoing, editable],
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

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!editable) return;
      for (const change of changes) {
        if (change.type === "position" && change.position && change.dragging === false) {
          onNodePositionChange?.({ id: change.id, position: change.position });
        }
        if (change.type === "remove") {
          onNodeRemoved?.(change.id);
        }
      }
    },
    [editable, onNodePositionChange, onNodeRemoved],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!editable) return;
      for (const change of changes) {
        if (change.type === "remove") {
          onConnectionRemoved?.(change.id);
        }
      }
    },
    [editable, onConnectionRemoved],
  );

  const handleConnect = useCallback(
    (link: RFConnection) => {
      if (!editable) return;
      if (!link.source || !link.target) return;
      onConnectionAdded?.({ fromNodeId: link.source, toNodeId: link.target });
    },
    [editable, onConnectionAdded],
  );

  return (
    <Canvas
      connectionLineComponent={Connection}
      edges={rfEdges}
      edgeTypes={edgeTypes}
      elementsSelectable={editable}
      fitView
      nodes={rfNodes}
      nodesConnectable={editable}
      nodesDraggable={editable}
      nodeTypes={nodeTypes}
      onNodesChange={editable ? handleNodesChange : undefined}
      onEdgesChange={editable ? handleEdgesChange : undefined}
      onConnect={editable ? handleConnect : undefined}
    >
      {showControls && <Controls />}
    </Canvas>
  );
}
