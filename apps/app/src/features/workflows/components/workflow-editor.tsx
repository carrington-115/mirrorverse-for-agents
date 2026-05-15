"use client";

import { useCallback, useState } from "react";
import type { ConfigSidebarType, WorkflowChatMessage } from "@/lib/types";
import { useWorkflowQuery, useWorkflowVersionQuery } from "@/features/workflows/api/queries";
import { WorkflowHeader } from "./workflow-header";
import { DocumentCanvas } from "./document-canvas";
import { MirropilotSidebar } from "./mirropilot-sidebar";
import { ConfigSidebar } from "./config-sidebar";
import { WorkflowToolbarPanel } from "./workflow-toolbar-panel";

interface WorkflowEditorProps {
  workflowId: string;
}

interface DocumentShape {
  metadata?: { title?: string };
  nodes?: Array<{
    id: string;
    name: string;
    kind: string;
    position: { x: number; y: number };
  }>;
  connections?: Array<{
    id: string;
    kind: string;
    fromNodeId: string;
    toNodeId: string;
  }>;
}

export function WorkflowEditor({ workflowId }: WorkflowEditorProps) {
  const [isMirropilotOpen, setIsMirropilotOpen] = useState(false);
  const [configSidebarType, _setConfigSidebarType] = useState<ConfigSidebarType | null>(null);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [chatMessages, _setChatMessages] = useState<WorkflowChatMessage[]>([]);
  // null means "view the latest version" — the dropdown sets a specific number
  // when the user picks an older one.
  const [pinnedVersion, setPinnedVersion] = useState<number | null>(null);

  const { data: latestData } = useWorkflowQuery(workflowId);
  const { data: pinnedData } = useWorkflowVersionQuery(workflowId, pinnedVersion);

  const version = pinnedVersion != null ? pinnedData?.version : latestData?.version;
  const doc = (version?.document ?? null) as DocumentShape | null;
  const workflowName = latestData?.workflow?.name ?? doc?.metadata?.title ?? "Untitled workflow";
  const workflowKind = latestData?.workflow?.kind ?? null;
  const workflowStatus = latestData?.workflow?.status ?? null;
  const updatedAt = latestData?.workflow?.updatedAt ?? null;
  const currentVersionNumber = version?.versionNumber ?? null;
  const nodes = doc?.nodes ?? [];
  const connections = doc?.connections ?? [];

  const handleToggleMirropilot = useCallback(() => {
    setIsMirropilotOpen((v) => !v);
  }, []);

  const handleSendMessage = useCallback(() => {}, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <WorkflowHeader
        workflowId={workflowId}
        workflowName={workflowName}
        workflowKind={workflowKind}
        workflowStatus={workflowStatus}
        updatedAt={updatedAt}
        currentVersionNumber={currentVersionNumber}
        onSelectVersion={setPinnedVersion}
        onToggleMirropilot={handleToggleMirropilot}
      />

      <div className="min-h-0 flex flex-1 gap-(--xs,8px) overflow-hidden px-(--xs,8px) pb-(--xs,8px)">
        {isMirropilotOpen && (
          <MirropilotSidebar messages={chatMessages} onSendMessage={handleSendMessage} />
        )}

        <div className="relative flex-1 overflow-hidden rounded-lg border border-border">
          <DocumentCanvas nodes={nodes} connections={connections} />
          {!latestData ? (
            <div className="inset-0 text-sm absolute grid place-items-center text-muted-foreground">
              Loading workflow…
            </div>
          ) : null}
          {latestData && latestData.workflow === null ? (
            <div className="inset-0 text-sm absolute grid place-items-center text-muted-foreground">
              Workflow not found.
            </div>
          ) : null}
        </div>

        {configSidebarType && <ConfigSidebar type={configSidebarType} />}

        {isToolbarOpen && <WorkflowToolbarPanel />}
      </div>

      <button
        type="button"
        aria-hidden
        className="hidden"
        onClick={() => setIsToolbarOpen((v) => !v)}
      />
    </div>
  );
}
