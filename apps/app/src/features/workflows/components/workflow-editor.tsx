"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import {
  defaultNodeForKind,
  type WorkflowConnectionInput,
  type WorkflowDocumentInput,
  type WorkflowNodeInput,
} from "@mirrorverse/agent/schemas";

import { Button } from "@/components/ui/button";
import type { WorkflowChatMessage } from "@/lib/types";
import { useWorkflowQuery, useWorkflowVersionQuery } from "@/features/workflows/api/queries";
import { useSaveWorkflowVersionMutation } from "@/features/workflows/api/mutations";

import { extractIconHints } from "@/features/workflows/lib/node-icon";

import { WorkflowHeader } from "./workflow-header";
import { DocumentCanvas, type CanvasNewConnection } from "./document-canvas";
import { MirropilotSidebar } from "./mirropilot-sidebar";
import { WorkflowPalette } from "./workflow-palette";

interface WorkflowEditorProps {
  workflowId: string;
}

// Browser-safe id generator. Uses Web Crypto when available, falls back to a
// Math.random shim for transient client-side ids (node creation, drag-and-drop).
function makeClientId(prefix: string): string {
  const fromBrowser = globalThis.crypto?.randomUUID?.();
  if (typeof fromBrowser === "string") return `${prefix}_${fromBrowser.slice(0, 8)}`;
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nextNodePosition(existing: readonly WorkflowNodeInput[]): { x: number; y: number } {
  if (existing.length === 0) return { x: 0, y: 0 };
  const maxX = Math.max(...existing.map((n) => n.position.x));
  return { x: maxX + 240, y: 0 };
}

export function WorkflowEditor({ workflowId }: WorkflowEditorProps) {
  const [isMirropilotOpen, setIsMirropilotOpen] = useState(false);
  const [chatMessages, _setChatMessages] = useState<WorkflowChatMessage[]>([]);
  const [pinnedVersion, setPinnedVersion] = useState<number | null>(null);
  const [workingDoc, setWorkingDoc] = useState<WorkflowDocumentInput | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  const { data: latestData } = useWorkflowQuery(workflowId);
  const { data: pinnedData } = useWorkflowVersionQuery(workflowId, pinnedVersion);
  const saveMutation = useSaveWorkflowVersionMutation();

  // When the user is viewing the latest version, that's editable. Pinned
  // older versions are read-only previews.
  const editable = pinnedVersion === null;

  const latestDoc = (latestData?.version?.document ?? null) as WorkflowDocumentInput | null;
  const pinnedDoc = (pinnedData?.version?.document ?? null) as WorkflowDocumentInput | null;

  // Reset working doc whenever the persisted latest changes (after a save,
  // after the workflow first loads, after the chat side commits a new version).
  useEffect(() => {
    if (!editable) return;
    if (!latestDoc) return;
    const snapshot = JSON.stringify(latestDoc);
    if (snapshot === savedSnapshot) return;
    setWorkingDoc(latestDoc);
    setSavedSnapshot(snapshot);
  }, [editable, latestDoc, savedSnapshot]);

  const displayDoc = editable ? workingDoc : pinnedDoc;
  const isDirty = useMemo(() => {
    if (!editable || !workingDoc) return false;
    return JSON.stringify(workingDoc) !== savedSnapshot;
  }, [editable, workingDoc, savedSnapshot]);

  const workflowName =
    latestData?.workflow?.name ?? displayDoc?.metadata.title ?? "Untitled workflow";
  const workflowKind = latestData?.workflow?.kind ?? null;
  const workflowStatus = latestData?.workflow?.status ?? null;
  const updatedAt = latestData?.workflow?.updatedAt ?? null;
  const currentVersionNumber = editable
    ? (latestData?.version?.versionNumber ?? null)
    : (pinnedData?.version?.versionNumber ?? null);

  const nodes = useMemo(
    () =>
      (displayDoc?.nodes ?? []).map((n) => ({
        ...n,
        hints: extractIconHints(n as unknown as Record<string, unknown>),
      })),
    [displayDoc],
  );
  const connections = displayDoc?.connections ?? [];

  const handleToggleMirropilot = useCallback(() => {
    setIsMirropilotOpen((v) => !v);
  }, []);

  const handleSendMessage = useCallback(() => {}, []);

  const handleAddNode = useCallback(
    (kind: string, overrides?: { name?: string; mcpDirectorySlug?: string }) => {
      if (!editable || !workingDoc) return;
      const id = makeClientId("node");
      const fallbackName = kind.replace(/^.*\./, "").replace(/_/g, " ");
      const node = defaultNodeForKind({
        kind,
        id,
        name: overrides?.name ?? fallbackName,
        position: nextNodePosition(workingDoc.nodes),
      });
      if (!node) {
        toast.error(`Adding "${kind}" isn't supported yet.`);
        return;
      }
      setWorkingDoc({ ...workingDoc, nodes: [...workingDoc.nodes, node] });
    },
    [editable, workingDoc],
  );

  const handlePositionChange = useCallback(
    ({ id, position }: { id: string; position: { x: number; y: number } }) => {
      setWorkingDoc((current) => {
        if (!current) return current;
        return {
          ...current,
          nodes: current.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
        };
      });
    },
    [],
  );

  const handleNodeRemoved = useCallback((id: string) => {
    setWorkingDoc((current) => {
      if (!current) return current;
      return {
        ...current,
        nodes: current.nodes.filter((n) => n.id !== id),
        connections: current.connections.filter((c) => c.fromNodeId !== id && c.toNodeId !== id),
      };
    });
  }, []);

  const handleConnectionRemoved = useCallback((id: string) => {
    setWorkingDoc((current) => {
      if (!current) return current;
      return {
        ...current,
        connections: current.connections.filter((c) => c.id !== id),
      };
    });
  }, []);

  const handleConnectionAdded = useCallback(({ fromNodeId, toNodeId }: CanvasNewConnection) => {
    setWorkingDoc((current) => {
      if (!current) return current;
      const exists = current.connections.some(
        (c) => c.fromNodeId === fromNodeId && c.toNodeId === toNodeId,
      );
      if (exists) return current;
      const next: WorkflowConnectionInput = {
        id: makeClientId("edge"),
        kind: "main",
        fromNodeId,
        fromOutputIndex: 0,
        toNodeId,
        toInputIndex: 0,
        condition: null,
      };
      return { ...current, connections: [...current.connections, next] };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!editable || !workingDoc || !isDirty) return;
    try {
      await saveMutation.mutateAsync({
        workflowId,
        document: workingDoc,
        summary: "Edited via canvas",
      });
      const snapshot = JSON.stringify(workingDoc);
      setSavedSnapshot(snapshot);
      toast.success("Saved as new version");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }, [editable, workingDoc, isDirty, saveMutation, workflowId]);

  const handleDiscard = useCallback(() => {
    if (!latestDoc) return;
    setWorkingDoc(latestDoc);
    setSavedSnapshot(JSON.stringify(latestDoc));
  }, [latestDoc]);

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

      {editable && isDirty ? (
        <div className="gap-2 px-3 py-1.5 flex items-center justify-end border-b border-border bg-muted/40">
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleDiscard}
            disabled={saveMutation.isPending}
          >
            <RotateCcw className="size-3" /> Discard
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Save className="size-3" />
            )}
            Save version
          </Button>
        </div>
      ) : null}

      <div className="min-h-0 flex flex-1 gap-(--xs,8px) overflow-hidden px-(--xs,8px) pb-(--xs,8px)">
        {isMirropilotOpen && (
          <MirropilotSidebar messages={chatMessages} onSendMessage={handleSendMessage} />
        )}

        {editable ? <WorkflowPalette onAdd={handleAddNode} disabled={!workingDoc} /> : null}

        <div className="relative flex-1 overflow-hidden rounded-lg border border-border">
          <DocumentCanvas
            nodes={nodes}
            connections={connections}
            editable={editable}
            onNodePositionChange={handlePositionChange}
            onNodeRemoved={handleNodeRemoved}
            onConnectionRemoved={handleConnectionRemoved}
            onConnectionAdded={handleConnectionAdded}
          />
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
      </div>
    </div>
  );
}
