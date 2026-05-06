"use client";

import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { Bot } from "lucide-react";
import { WorkflowNodeData } from "@/lib/types";

type AgentNodeType = Node<WorkflowNodeData, "agentNode">;

function AgentNode({ selected }: NodeProps<AgentNodeType>) {
  return (
    <div
      className="relative"
      style={{ width: 176, height: 60 }}
    >
      {/* Left handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 6,
          height: 6,
          background: "var(--border-3)",
          border: "1px solid var(--border-4)",
          left: -3,
        }}
      />

      {/* Card */}
      <div
        className="w-full h-full rounded-md flex items-center px-[15px]"
        style={{
          background: "var(--accent-0)",
          border: `1px solid ${selected ? "var(--primary)" : "var(--border-3)"}`,
          boxSizing: "border-box",
        }}
      >
        <div className="flex items-center gap-[var(--2xs,4px)]">
          <Bot
            className="shrink-0"
            style={{
              width: 24,
              height: 24,
              color: "var(--unofficial-foreground-alt)",
            }}
          />
          <span
            className="text-[14px] font-normal leading-[20px] whitespace-nowrap"
            style={{ color: "var(--unofficial-foreground-alt)" }}
          >
            Automation agent
          </span>
        </div>
      </div>

      {/* Bottom handles row */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="b-left"
        style={{
          width: 4,
          height: 4,
          background: "var(--border-3)",
          border: "none",
          bottom: -2,
          left: "35%",
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b-center"
        style={{
          width: 4,
          height: 4,
          background: "var(--border-3)",
          border: "none",
          bottom: -2,
          left: "50%",
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b-right"
        style={{
          width: 4,
          height: 4,
          background: "var(--border-3)",
          border: "none",
          bottom: -2,
          left: "65%",
        }}
      />

      {/* Right handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 6,
          height: 6,
          background: "var(--border-3)",
          border: "1px solid var(--border-4)",
          right: -3,
        }}
      />
    </div>
  );
}

export default memo(AgentNode);
