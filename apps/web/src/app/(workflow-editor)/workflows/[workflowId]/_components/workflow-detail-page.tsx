"use client";

import { useState, useCallback } from "react";
import { ConfigSidebarType, WorkflowChatMessage } from "@/lib/types";
import WorkflowHeader from "./workflow-header";
import WorkflowCanvas from "./workflow-canvas";
import MirrropilotSidebar from "./mirrropilot-sidebar";
import ConfigSidebar from "./config-sidebar";
import WorkflowToolbarPanel from "./workflow-toolbar-panel";

interface WorkflowDetailPageProps {
  workflowId: string;
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

export default function WorkflowDetailPage({ workflowId: _workflowId }: WorkflowDetailPageProps) {
  const [activeTab, setActiveTab] = useState<"builder" | "prompter">("builder");
  const [isMirrropilotOpen, setIsMirrropilotOpen] = useState(false);
  const [configSidebarType, setConfigSidebarType] = useState<ConfigSidebarType | null>(null);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<WorkflowChatMessage[]>([]);

  const workflowName = "Untitled workflow";

  const handleToggleMirrropilot = useCallback(() => {
    setIsMirrropilotOpen((v) => !v);
  }, []);

  const handleNodeSelect = useCallback((type: ConfigSidebarType | null) => {
    setConfigSidebarType(type);
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    const userMsg: WorkflowChatMessage = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    // Simulated agent response
    setTimeout(() => {
      const agentMsg: WorkflowChatMessage = {
        id: generateId(),
        role: "agent",
        content:
          "Sure thing! I'm analyzing your workflow and will help you configure it. What would you like to adjust?",
        timestamp: new Date(),
        thoughtDuration: 4,
      };
      setChatMessages((prev) => [...prev, agentMsg]);
    }, 1200);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <WorkflowHeader
        workflowName={workflowName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleMirrropilot={handleToggleMirrropilot}
        isMirrropilotOpen={isMirrropilotOpen}
      />

      <div className="min-h-0 flex flex-1 gap-(--xs,8px) overflow-hidden px-(--xs,8px) pb-(--xs,8px)">
        {isMirrropilotOpen && (
          <MirrropilotSidebar messages={chatMessages} onSendMessage={handleSendMessage} />
        )}

        <WorkflowCanvas
          onNodeSelect={handleNodeSelect}
          onToggleMirrropilot={handleToggleMirrropilot}
          isToolbarOpen={isToolbarOpen}
          onToggleToolbar={() => setIsToolbarOpen((v) => !v)}
        />

        {configSidebarType && <ConfigSidebar type={configSidebarType} />}

        {isToolbarOpen && <WorkflowToolbarPanel />}
      </div>
    </div>
  );
}
