"use client";

import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { DocumentNode, type DocumentNodeData } from "./nodes/document-node";

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

const nodeTypes = { documentNode: DocumentNode } as const;

export function DocumentCanvas({ nodes, connections }: DocumentCanvasProps) {
  const rfNodes = useMemo<Node<DocumentNodeData>[]>(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: "documentNode",
        position: n.position,
        data: { label: n.name, kind: n.kind },
      })),
    [nodes],
  );

  const rfEdges = useMemo<Edge[]>(
    () =>
      connections.map((c) => ({
        id: c.id,
        source: c.fromNodeId,
        target: c.toNodeId,
        animated: c.kind === "main",
        label: c.kind === "main" ? undefined : c.kind,
      })),
    [connections],
  );

  return (
    <ReactFlowProvider>
      <div className="h-full w-full">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          minZoom={0.1}
          maxZoom={4}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#d4d4d4" />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
