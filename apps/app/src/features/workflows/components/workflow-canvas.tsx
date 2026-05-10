"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  type NodeMouseHandler,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConfigSidebarType, WorkflowNodeData } from "@/lib/types";
import { AgentNode } from "./nodes/agent-node";
import { WorkflowToolbar } from "./workflow-toolbar";

const nodeTypes = { agentNode: AgentNode } as const;

const initialNodes: Node<WorkflowNodeData>[] = [
  {
    id: "agent-1",
    type: "agentNode",
    position: { x: 0, y: 0 },
    data: { label: "Automation agent", configType: "agent" },
  },
];

interface WorkflowCanvasProps {
  onNodeSelect: (configType: ConfigSidebarType | null) => void;
  onToggleMirropilot: () => void;
  isToolbarOpen: boolean;
  onToggleToolbar: () => void;
}

function Canvas({
  onNodeSelect,
  onToggleMirropilot: _onToggleMirropilot,
  isToolbarOpen,
  onToggleToolbar,
}: WorkflowCanvasProps) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState([]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const data = node.data as WorkflowNodeData;
      onNodeSelect(data.configType ?? "agent");
    },
    [onNodeSelect],
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div
      className="relative flex-1 overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--border-1)" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        minZoom={0.1}
        maxZoom={4}
        style={{ background: "var(--accent-0)" }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#d4d4d4" />
      </ReactFlow>

      <div className="absolute top-[10px] right-[10px] z-10">
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-md"
          style={isToolbarOpen ? { background: "var(--accent)" } : {}}
          onClick={onToggleToolbar}
          title="Toggle tool sidebar"
        >
          <PanelRight className="size-4" />
        </Button>
      </div>

      <div className="absolute bottom-[20px] left-1/2 z-10 -translate-x-1/2">
        <WorkflowToolbar />
      </div>
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
