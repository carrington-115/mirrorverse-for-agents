"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import {
  defaultNodeForKind,
  workflowDocumentSchema,
  type WorkflowConnectionInput,
  type WorkflowDocumentInput,
  type WorkflowNodeInput,
} from "@mirrorverse/agent/schemas";

import { Button } from "@/components/ui/button";
import { useWorkflowQuery, useWorkflowVersionQuery } from "@/features/workflows/api/queries";
import { useSaveWorkflowVersionMutation } from "@/features/workflows/api/mutations";

import { extractIconHints } from "@/features/workflows/lib/node-icon";

import { WorkflowHeader } from "./workflow-header";
import { DocumentCanvas, type CanvasNewConnection } from "./document-canvas";
import { WorkflowPalette } from "./workflow-palette";
import { NodeInspector } from "./node-inspector";

interface WorkflowEditorProps {
  workflowId: string;
}

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

// Derive validation errors keyed by node id from a Zod parse result.
function buildValidationErrors(doc: WorkflowDocumentInput): Map<string, string[]> {
  const result = workflowDocumentSchema.safeParse(doc);
  const map = new Map<string, string[]>();
  if (result.success) return map;
  for (const issue of result.error.issues) {
    if (issue.path[0] === "nodes" && typeof issue.path[1] === "number") {
      const nodeId = doc.nodes[issue.path[1]]?.id;
      if (nodeId) {
        const existing = map.get(nodeId) ?? [];
        existing.push(issue.message);
        map.set(nodeId, existing);
      }
    }
  }
  return map;
}

// Parse composite edge id back to connection fields
function parseEdgeId(
  id: string,
): { from: string; fromPort: string; to: string; toPort: string } | null {
  const parts = id.split("|");
  if (parts.length !== 4) return null;
  const [from, fromPort, to, toPort] = parts;
  if (!from || !fromPort || !to || !toPort) return null;
  return { from, fromPort, to, toPort };
}

const MAX_HISTORY = 50;

export function WorkflowEditor({ workflowId }: WorkflowEditorProps) {
  const [pinnedVersion, setPinnedVersion] = useState<number | null>(null);
  const [workingDoc, setWorkingDocRaw] = useState<WorkflowDocumentInput | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Undo / redo stacks (not in state to avoid extra renders)
  const pastDocs = useRef<WorkflowDocumentInput[]>([]);
  const futureDocs = useRef<WorkflowDocumentInput[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Clipboard for copy/paste
  const clipboard = useRef<WorkflowNodeInput[]>([]);

  const { data: latestData } = useWorkflowQuery(workflowId);
  const { data: pinnedData } = useWorkflowVersionQuery(workflowId, pinnedVersion);
  const saveMutation = useSaveWorkflowVersionMutation();

  const editable = pinnedVersion === null;

  const latestDoc = (latestData?.version?.document ?? null) as WorkflowDocumentInput | null;
  const pinnedDoc = (pinnedData?.version?.document ?? null) as WorkflowDocumentInput | null;

  // Wrap setWorkingDoc to push history before every mutation
  const setWorkingDoc = useCallback(
    (
      updater:
        | WorkflowDocumentInput
        | ((prev: WorkflowDocumentInput | null) => WorkflowDocumentInput | null),
    ) => {
      setWorkingDocRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (next && prev) {
          pastDocs.current = [...pastDocs.current.slice(-MAX_HISTORY + 1), prev];
          futureDocs.current = [];
          setCanUndo(true);
          setCanRedo(false);
        }
        return next;
      });
    },
    [],
  );

  // Initialize working doc from latest persisted version
  useEffect(() => {
    if (!editable) return;
    if (!latestDoc) return;
    const snapshot = JSON.stringify(latestDoc);
    if (snapshot === savedSnapshot) return;
    setWorkingDocRaw(latestDoc);
    setSavedSnapshot(snapshot);
    // Reset history when a new version loads
    pastDocs.current = [];
    futureDocs.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [editable, latestDoc, savedSnapshot]);

  const displayDoc = editable ? workingDoc : pinnedDoc;
  const isDirty = useMemo(() => {
    if (!editable || !workingDoc) return false;
    return JSON.stringify(workingDoc) !== savedSnapshot;
  }, [editable, workingDoc, savedSnapshot]);

  // Validation (client-side zod, only while editing)
  const validationErrors = useMemo(() => {
    if (!editable || !workingDoc) return new Map<string, string[]>();
    return buildValidationErrors(workingDoc);
  }, [editable, workingDoc]);

  const hasValidationErrors = validationErrors.size > 0;

  const workflowName = displayDoc?.name ?? latestData?.workflow?.name ?? "New Workflow";
  const workflowKind = latestData?.workflow?.kind ?? null;
  const workflowStatus = latestData?.workflow?.status ?? null;
  const updatedAt = latestData?.workflow?.updatedAt ?? null;
  const originChatId =
    (latestData as unknown as { originChatId?: string | null })?.originChatId ?? null;
  const currentVersionNumber = editable
    ? (latestData?.version?.versionNumber ?? null)
    : (pinnedData?.version?.versionNumber ?? null);

  const nodes = useMemo(
    () =>
      (displayDoc?.nodes ?? []).map((n) => ({
        ...n,
        hints: extractIconHints(n as unknown as Record<string, unknown>),
        width: typeof n.params?.width === "number" ? n.params.width : undefined,
        height: typeof n.params?.height === "number" ? n.params.height : undefined,
        content: typeof n.params?.content === "string" ? n.params.content : undefined,
        color: typeof n.params?.color === "number" ? n.params.color : undefined,
      })),
    [displayDoc],
  );

  const connections = displayDoc?.connections ?? [];

  const selectedNode = useMemo(
    () => workingDoc?.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [workingDoc, selectedNodeId],
  );

  // --- Undo / redo ---

  const undo = useCallback(() => {
    const prev = pastDocs.current.pop();
    if (!prev) return;
    setWorkingDocRaw((current) => {
      if (current) futureDocs.current = [...futureDocs.current, current];
      setCanUndo(pastDocs.current.length > 0);
      setCanRedo(true);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    const next = futureDocs.current.pop();
    if (!next) return;
    setWorkingDocRaw((current) => {
      if (current) pastDocs.current = [...pastDocs.current, current];
      setCanRedo(futureDocs.current.length > 0);
      setCanUndo(true);
      return next;
    });
  }, []);

  // --- Keyboard shortcuts ---

  useEffect(() => {
    if (!editable) return;
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if ((mod && e.shiftKey && e.key === "z") || (mod && e.key === "y")) {
        e.preventDefault();
        redo();
        return;
      }
      // Copy selected node
      if (mod && e.key === "c" && selectedNodeId) {
        const node = workingDoc?.nodes.find((n) => n.id === selectedNodeId);
        if (node) clipboard.current = [node];
        return;
      }
      // Paste
      if (mod && e.key === "v" && clipboard.current.length > 0) {
        e.preventDefault();
        setWorkingDoc((current) => {
          if (!current) return current;
          const pasted = clipboard.current.map((n) => ({
            ...n,
            id: makeClientId("node"),
            position: { x: n.position.x + 40, y: n.position.y + 40 },
          }));
          return { ...current, nodes: [...current.nodes, ...pasted] };
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editable, undo, redo, selectedNodeId, workingDoc, setWorkingDoc]);

  // --- Canvas mutation handlers ---

  const handleAddNode = useCallback(
    (kind: string, overrides?: { name?: string; mcpDirectorySlug?: string }) => {
      if (!editable || !workingDoc) return;
      const id = makeClientId("node");
      const node = defaultNodeForKind({ kind, id, position: nextNodePosition(workingDoc.nodes) });
      if (!node) {
        toast.error(`Adding "${kind}" isn&apos;t supported yet.`);
        return;
      }
      const finalNode: WorkflowNodeInput = overrides?.mcpDirectorySlug
        ? { ...node, params: { ...node.params, mcpServerId: overrides.mcpDirectorySlug } }
        : node;
      setWorkingDoc((current) => {
        if (!current) return current;
        return { ...current, nodes: [...current.nodes, finalNode] };
      });
    },
    [editable, workingDoc, setWorkingDoc],
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
    [setWorkingDoc],
  );

  const handleNodeRemoved = useCallback(
    (id: string) => {
      setSelectedNodeId((sel) => (sel === id ? null : sel));
      setWorkingDoc((current) => {
        if (!current) return current;
        return {
          ...current,
          nodes: current.nodes.filter((n) => n.id !== id),
          connections: current.connections.filter((c) => c.from !== id && c.to !== id),
        };
      });
    },
    [setWorkingDoc],
  );

  const handleConnectionRemoved = useCallback(
    (edgeId: string) => {
      const parsed = parseEdgeId(edgeId);
      if (!parsed) return;
      setWorkingDoc((current) => {
        if (!current) return current;
        return {
          ...current,
          connections: current.connections.filter(
            (c) =>
              !(
                c.from === parsed.from &&
                c.fromPort === parsed.fromPort &&
                c.to === parsed.to &&
                c.toPort === parsed.toPort
              ),
          ),
        };
      });
    },
    [setWorkingDoc],
  );

  const handleConnectionAdded = useCallback(
    ({ fromNodeId, fromHandleId, toNodeId, toHandleId }: CanvasNewConnection) => {
      setWorkingDoc((current) => {
        if (!current) return current;
        const fromPort = fromHandleId ?? "main-out";
        const toPort = toHandleId ?? "main-in";
        const exists = current.connections.some(
          (c) => c.from === fromNodeId && c.fromPort === fromPort && c.to === toNodeId,
        );
        if (exists) return current;
        const next: WorkflowConnectionInput = {
          from: fromNodeId,
          fromPort,
          to: toNodeId,
          toPort,
        };
        return {
          ...current,
          connections: [...current.connections, next],
        };
      });
    },
    [setWorkingDoc],
  );

  const handleNodeUpdate = useCallback(
    (patch: Partial<WorkflowNodeInput>) => {
      if (!selectedNodeId) return;
      setWorkingDoc((current) => {
        if (!current) return current;
        return {
          ...current,
          nodes: current.nodes.map((n) =>
            n.id === selectedNodeId ? ({ ...n, ...patch } as WorkflowNodeInput) : n,
          ),
        };
      });
    },
    [selectedNodeId, setWorkingDoc],
  );

  const handleSave = useCallback(async () => {
    if (!editable || !workingDoc || !isDirty || hasValidationErrors) return;
    try {
      await saveMutation.mutateAsync({
        workflowId,
        document: workingDoc,
        summary: "Edited via canvas",
      });
      const snapshot = JSON.stringify(workingDoc);
      setSavedSnapshot(snapshot);
      pastDocs.current = [];
      futureDocs.current = [];
      setCanUndo(false);
      setCanRedo(false);
      toast.success("Saved as new version");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }, [editable, workingDoc, isDirty, hasValidationErrors, saveMutation, workflowId]);

  const handleDiscard = useCallback(() => {
    if (!latestDoc) return;
    setWorkingDocRaw(latestDoc);
    setSavedSnapshot(JSON.stringify(latestDoc));
    pastDocs.current = [];
    futureDocs.current = [];
    setCanUndo(false);
    setCanRedo(false);
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
        originChatId={originChatId}
        onSelectVersion={setPinnedVersion}
        canUndo={editable ? canUndo : undefined}
        canRedo={editable ? canRedo : undefined}
        onUndo={editable ? undo : undefined}
        onRedo={editable ? redo : undefined}
      />

      {editable && isDirty ? (
        <div className="gap-2 px-3 py-1.5 flex items-center justify-end border-b border-border bg-muted/40">
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
          {hasValidationErrors && (
            <span className="text-xs text-destructive">
              {validationErrors.size} node{validationErrors.size !== 1 ? "s" : ""} with errors
            </span>
          )}
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
            disabled={saveMutation.isPending || hasValidationErrors}
            title={hasValidationErrors ? "Fix validation errors before saving" : undefined}
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
        {editable ? <WorkflowPalette onAdd={handleAddNode} disabled={!workingDoc} /> : null}

        <div className="relative flex-1 overflow-hidden rounded-lg border border-border">
          <DocumentCanvas
            nodes={nodes}
            connections={connections}
            editable={editable}
            selectedNodeId={selectedNodeId}
            validationErrors={validationErrors}
            onNodePositionChange={handlePositionChange}
            onNodeRemoved={handleNodeRemoved}
            onConnectionRemoved={handleConnectionRemoved}
            onConnectionAdded={handleConnectionAdded}
            onNodeSelect={setSelectedNodeId}
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

        {editable && selectedNode ? (
          <NodeInspector
            node={selectedNode}
            validationErrors={validationErrors.get(selectedNode.id)}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNodeId(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
