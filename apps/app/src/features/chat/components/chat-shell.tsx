"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";

import { useChatQuery } from "@/features/chat/api/queries";
import { contentBlocksToUIMessage } from "@/features/chat/lib/content-blocks";

import { ChatRuntime } from "./chat-runtime";
import { ChatSkeleton } from "./chat-skeleton";
import { ChatWorkflowSidePanel } from "./chat-workflow-side-panel";

const PANEL_MIN_VW = 20;
const PANEL_MAX_VW = 60;
const PANEL_DEFAULT_VW = 40;

interface ChatShellProps {
  sessionId: string;
}

export function ChatShell({ sessionId }: ChatShellProps) {
  const { data, isLoading } = useChatQuery(sessionId);
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_VW);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const dragState = useRef({ isDragging: false, startX: 0, startWidthPx: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const initialMessages = useMemo(
    () => (data ? data.messages.map(contentBlocksToUIMessage) : []),
    [data],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragState.current = {
      isDragging: true,
      startX: e.clientX,
      startWidthPx: panelRef.current?.offsetWidth ?? 0,
    };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.isDragging) return;
      const dx = dragState.current.startX - e.clientX;
      const newWidthPx = dragState.current.startWidthPx + dx;
      const vw = window.innerWidth / 100;
      const newWidthVw = newWidthPx / vw;
      setPanelWidth(Math.min(PANEL_MAX_VW, Math.max(PANEL_MIN_VW, newWidthVw)));
    };

    const handleMouseUp = () => {
      dragState.current.isDragging = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (isLoading || !data) return <ChatSkeleton />;

  const workflowId = data.chat?.workflowId ?? null;

  if (!workflowId) {
    return (
      <div className="mx-auto flex h-full w-full max-w-[860px] flex-col">
        <ChatRuntime sessionId={sessionId} initialMessages={initialMessages} />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="min-w-0 flex h-full flex-1 flex-col">
        <ChatRuntime sessionId={sessionId} initialMessages={initialMessages} />
      </div>
      {isPanelOpen && (
        <>
          <div
            className="lg:flex w-1 group hidden shrink-0 cursor-col-resize items-stretch select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="mx-auto w-px bg-border transition-colors duration-150 group-hover:bg-primary/50" />
          </div>
          <div
            ref={panelRef}
            className="lg:flex hidden h-full shrink-0 flex-col"
            style={{ width: `${panelWidth}vw` }}
          >
            <ChatWorkflowSidePanel workflowId={workflowId} onClose={() => setIsPanelOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
