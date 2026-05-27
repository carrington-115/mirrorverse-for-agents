"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  Connection as RFConnection,
  Edge as RFEdge,
  EdgeChange,
  IsValidConnection,
  Node as RFNode,
  NodeChange,
} from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

import { Canvas } from "@mirrorverse/ui/ai-elements/canvas";
import { Connection } from "@mirrorverse/ui/ai-elements/connection";
import { Edge } from "@mirrorverse/ui/ai-elements/edge";
import { Controls } from "@mirrorverse/ui/ai-elements/controls";
import { cn } from "@/lib/utils";

import { NodeIcon, type NodeIconHints } from "@/features/workflows/lib/node-icon";
import {
  getHandlesForKind,
  connectionKindFromHandleId,
  edgeTypeForKind,
  edgeColorForKind,
  AI_SLOT_COLORS,
} from "@/features/workflows/lib/node-handles";

interface DocumentNodeShape {
  readonly id: string;
  readonly type: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly params: Record<string, unknown>;
  readonly hints?: NodeIconHints;
  readonly width?: number;
  readonly height?: number;
  readonly content?: string;
  readonly color?: number;
}

interface DocumentConnectionShape {
  readonly from: string;
  readonly fromPort: string;
  readonly to: string;
  readonly toPort: string;
}

export interface CanvasNodeChange {
  readonly id: string;
  readonly position: { readonly x: number; readonly y: number };
}

export interface CanvasNewConnection {
  readonly fromNodeId: string;
  readonly fromHandleId: string;
  readonly toNodeId: string;
  readonly toHandleId: string;
  readonly connectionKind: string;
}

interface DocumentCanvasProps {
  readonly nodes: readonly DocumentNodeShape[];
  readonly connections: readonly DocumentConnectionShape[];
  readonly editable?: boolean;
  readonly showControls?: boolean;
  readonly selectedNodeId?: string | null;
  readonly validationErrors?: ReadonlyMap<string, readonly string[]>;
  readonly onNodePositionChange?: (change: CanvasNodeChange) => void;
  readonly onNodeRemoved?: (id: string) => void;
  readonly onConnectionRemoved?: (id: string) => void;
  readonly onConnectionAdded?: (link: CanvasNewConnection) => void;
  readonly onNodeSelect?: (id: string | null) => void;
}

// Node type → pastel sticky note background colors
const STICKY_COLORS = [
  "#fef9c3", // yellow
  "#dcfce7", // green
  "#dbeafe", // blue
  "#fce7f3", // pink
  "#ede9fe", // purple
  "#ffedd5", // orange
];

// Format "trigger.webhook" → "Webhook"
function formatTypeLabel(type: string): string {
  const dot = type.lastIndexOf(".");
  const tail = dot >= 0 ? type.slice(dot + 1) : type;
  return tail.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Stable composite edge id from connection fields
function makeEdgeId(from: string, fromPort: string, to: string, toPort: string): string {
  return `${from}|${fromPort}|${to}|${toPort}`;
}

// Workflow JSON stores bare port names ("main", "ai_languageModel") but React
// Flow handle IDs carry a "-out" / "-in" direction suffix. Normalise here so
// edges attach to the right handle regardless of which form is stored.
function toSourceHandle(port: string): string {
  if (port.endsWith("-out") || port.endsWith("-in")) return port;
  return `${port}-out`;
}
function toTargetHandle(port: string): string {
  if (port.endsWith("-in") || port.endsWith("-out")) return port;
  return `${port}-in`;
}

// --- Workflow node (all types except sticky) ---

interface WorkflowNodeData extends Record<string, unknown> {
  readonly label: string;
  readonly nodeType: string;
  readonly hints?: NodeIconHints;
  readonly editable: boolean;
  readonly hasValidationError: boolean;
}

function WorkflowNode({ data, selected }: { data: WorkflowNodeData; selected?: boolean }) {
  const handles = getHandlesForKind(data.nodeType);
  const positionMap = {
    Left: Position.Left,
    Right: Position.Right,
    Top: Position.Top,
    Bottom: Position.Bottom,
  } as const;

  const bottomHandles = handles.filter((h) => h.position === "Bottom");
  const otherHandles = handles.filter((h) => h.position !== "Bottom");

  return (
    <div
      className={cn(
        "shadow-sm relative flex flex-col rounded-md border bg-card text-card-foreground",
        "min-w-[200px]",
        selected && "ring-2 ring-primary",
        data.hasValidationError && "ring-2 ring-destructive",
      )}
    >
      {/* Main handles (left/right/top) */}
      {otherHandles.map((h) => {
        const color = edgeColorForKind(h.connectionKind);
        const handleStyle = color ? { ...(h.style ?? {}), backgroundColor: color } : h.style;
        return (
          <Handle
            key={h.id}
            id={h.id}
            type={h.type}
            position={positionMap[h.position]}
            style={handleStyle}
            className={cn(
              "!w-3 !h-3 !rounded-full !border-2 !border-background",
              color ? "" : "!bg-primary",
            )}
          />
        );
      })}

      {/* Node header */}
      <div className="gap-2.5 min-w-0 p-3 flex w-full items-start rounded-t-md border-b bg-secondary">
        <NodeIcon kind={data.nodeType} hints={data.hints} />
        <div className="min-w-0 flex flex-1 flex-col">
          <span className="text-xs font-semibold leading-tight truncate text-secondary-foreground">
            {data.label}
          </span>
          <span className="text-[10px] text-muted-foreground">{data.nodeType}</span>
        </div>
        {data.hasValidationError && (
          <span className="font-medium shrink-0 text-[10px] text-destructive">!</span>
        )}
      </div>

      {/* AI slot labels */}
      {bottomHandles.length > 0 && (
        <div className="h-7 px-2 relative flex items-end rounded-b-md border-t bg-secondary/50">
          {bottomHandles.map((h) => {
            const color = AI_SLOT_COLORS[h.connectionKind] ?? "currentColor";
            return (
              <div
                key={h.id}
                className="bottom-0 absolute flex flex-col items-center"
                style={{ left: h.style?.left }}
              >
                <span
                  className="mb-0.5 font-medium text-[8px]"
                  style={{ color, transform: "translateX(-50%)" }}
                >
                  {h.label}
                </span>
                <Handle
                  id={h.id}
                  type={h.type}
                  position={positionMap[h.position]}
                  className="!w-3 !h-3 !rounded-full !border-2 !border-background"
                  style={{ backgroundColor: color, position: "static", transform: "none" }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Sticky note node ---

interface StickyNoteData extends Record<string, unknown> {
  readonly content: string;
  readonly color: number;
  readonly editable: boolean;
  readonly onContentChange?: (id: string, content: string) => void;
  readonly nodeId: string;
}

function StickyNoteNode({ data, selected }: { data: StickyNoteData; selected?: boolean }) {
  const bg = STICKY_COLORS[data.color % STICKY_COLORS.length] ?? STICKY_COLORS[0];
  return (
    <div
      className={cn("shadow-sm p-3 text-xs rounded-md border", selected && "ring-2 ring-primary")}
      style={{ background: bg, minWidth: 150, minHeight: 80 }}
    >
      {data.editable ? (
        <textarea
          className="text-xs h-full w-full resize-none bg-transparent text-foreground/80 outline-none placeholder:text-muted-foreground"
          value={data.content}
          placeholder="Add a note…"
          onChange={(e) => data.onContentChange?.(data.nodeId, e.target.value)}
        />
      ) : (
        <p className="whitespace-pre-wrap text-foreground/80">{data.content || "…"}</p>
      )}
    </div>
  );
}

const nodeTypes = {
  workflow: WorkflowNode,
  stickyNote: StickyNoteNode,
} as const;

const edgeTypes = {
  animated: Edge.Animated,
  temporary: Edge.Temporary,
  aiSlot: Edge.AiSlot,
} as const;

export function DocumentCanvas({
  nodes,
  connections,
  editable = false,
  showControls = true,
  selectedNodeId,
  validationErrors,
  onNodePositionChange,
  onNodeRemoved,
  onConnectionRemoved,
  onConnectionAdded,
  onNodeSelect,
}: DocumentCanvasProps) {
  // Stable ref so sticky-note onChange doesn't re-create rfNodes on every keystroke
  const onNodeSelectRef = useRef(onNodeSelect);
  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  });

  const rfNodes = useMemo<RFNode[]>(
    () =>
      nodes.map((n) => {
        if (n.type === "editor.sticky_note") {
          return {
            id: n.id,
            type: "stickyNote",
            position: n.position,
            style: { width: n.width ?? 200, height: n.height ?? 120 },
            selected: n.id === selectedNodeId,
            data: {
              content: n.content ?? "",
              color: n.color ?? 0,
              editable,
              nodeId: n.id,
            } satisfies StickyNoteData,
          };
        }
        return {
          id: n.id,
          type: "workflow",
          position: n.position,
          selected: n.id === selectedNodeId,
          data: {
            label: formatTypeLabel(n.type),
            nodeType: n.type,
            hints: n.hints,
            editable,
            hasValidationError: (validationErrors?.get(n.id)?.length ?? 0) > 0,
          } satisfies WorkflowNodeData,
        };
      }),
    [nodes, editable, selectedNodeId, validationErrors],
  );

  const rfEdges = useMemo<RFEdge[]>(
    () =>
      connections.map((c) => {
        const connectionKind = connectionKindFromHandleId(c.fromPort);
        const edgeType = edgeTypeForKind(connectionKind);
        const color = edgeColorForKind(connectionKind);
        return {
          id: makeEdgeId(c.from, c.fromPort, c.to, c.toPort),
          source: c.from,
          sourceHandle: toSourceHandle(c.fromPort),
          target: c.to,
          targetHandle: toTargetHandle(c.toPort),
          type: edgeType,
          ...(color ? { style: { stroke: color } } : {}),
        };
      }),
    [connections],
  );

  const isValidConnection = useCallback<IsValidConnection>((conn) => {
    const sourceKind = connectionKindFromHandleId(conn.sourceHandle);
    const targetKind = connectionKindFromHandleId(conn.targetHandle);
    return sourceKind === targetKind;
  }, []);

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
        if (change.type === "select") {
          onNodeSelectRef.current?.(change.selected ? change.id : null);
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
      const fromHandleId = link.sourceHandle ?? "main-out";
      const toHandleId = link.targetHandle ?? "main-in";
      const connectionKind = connectionKindFromHandleId(fromHandleId);
      onConnectionAdded?.({
        fromNodeId: link.source,
        fromHandleId,
        toNodeId: link.target,
        toHandleId,
        connectionKind,
      });
    },
    [editable, onConnectionAdded],
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelectRef.current?.(null);
  }, []);

  return (
    <Canvas
      connectionLineComponent={Connection}
      edges={rfEdges}
      edgeTypes={edgeTypes}
      elementsSelectable={editable}
      fitView
      isValidConnection={editable ? isValidConnection : undefined}
      nodes={rfNodes}
      nodesConnectable={editable}
      nodesDraggable={editable}
      nodeTypes={nodeTypes}
      onNodesChange={editable ? handleNodesChange : undefined}
      onEdgesChange={editable ? handleEdgesChange : undefined}
      onConnect={editable ? handleConnect : undefined}
      onPaneClick={editable ? handlePaneClick : undefined}
    >
      {showControls && <Controls />}
    </Canvas>
  );
}
