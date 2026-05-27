"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const { data, isLoading, isError } = useChatQuery(sessionId);
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isError) router.replace("/mirrorpilot");
  }, [isError, router]);
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_VW);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const dragState = useRef({ isDragging: false, startX: 0, startWidthPx: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const initialMessages = useMemo(
    () => (data ? data.messages.map(contentBlocksToUIMessage) : []),
    [data],
  );

  const handleWorkflowSelect = useCallback((workflowId: string) => {
    setSelectedWorkflowId(workflowId);
  }, []);

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

  const chatWorkflowId = data.chat?.workflowId ?? null;
  const effectiveWorkflowId = selectedWorkflowId ?? chatWorkflowId;
  const showPanel = !!effectiveWorkflowId;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="min-w-0 flex h-full flex-1 flex-col">
        <ChatRuntime
          key={sessionId}
          sessionId={sessionId}
          initialMessages={initialMessages}
          onWorkflowSelect={handleWorkflowSelect}
        />
      </div>
      {showPanel && !isMobile && (
        <>
          <div
            className="md:flex w-1 group hidden shrink-0 cursor-col-resize items-stretch select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="mx-auto w-px bg-border transition-colors duration-150 group-hover:bg-primary/50" />
          </div>
          <div
            ref={panelRef}
            className="md:flex hidden h-full shrink-0 flex-col"
            style={{ width: `${panelWidth}vw` }}
          >
            <ChatWorkflowSidePanel workflowId={effectiveWorkflowId} />
          </div>
        </>
      )}
      {isMobile && (
        <Drawer open={showPanel} dismissible={false}>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Workflow details</DrawerTitle>
            </DrawerHeader>
            <div className="min-h-0 flex-1">
              {effectiveWorkflowId && (
                <ChatWorkflowSidePanel workflowId={effectiveWorkflowId} showControls={false} />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
