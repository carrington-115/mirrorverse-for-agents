"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatWorkflowSidePanel } from "@/features/chat/components/chat-workflow-side-panel";
import { useTRPC } from "@/lib/trpc/client";

import { ChatRuntime } from "../components/chat-runtime";

const PANEL_MIN_VW = 20;
const PANEL_MAX_VW = 60;
const PANEL_DEFAULT_VW = 40;

export function NewChatPage() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const isMobile = useIsMobile();
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT_VW);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const dragState = useRef({ isDragging: false, startX: 0, startWidthPx: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const isMountedRef = useRef(true);
  const router = useRouter();
  const qc = useQueryClient();
  const trpc = useTRPC();

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleFirstMessage = useCallback(() => {
    setHasStartedChat(true);
    // Cosmetically update the browser URL so the sidebar active state is correct
    // while streaming. After the stream finishes, router.replace syncs Next.js
    // router state to prevent layout-tree divergence on subsequent navigation.
    window.history.replaceState(null, "", `/mirrorpilot/${sessionId}`);
  }, [sessionId]);

  const handleStreamFinish = useCallback(() => {
    if (!hasStartedChat) return;
    void (async () => {
      // Pre-fetch so ChatShell has data in cache on mount — no skeleton flash.
      await qc.prefetchQuery(trpc.chats.get.queryOptions({ chatId: sessionId }));
      if (isMountedRef.current) {
        router.replace(`/mirrorpilot/${sessionId}`);
      }
    })();
  }, [hasStartedChat, sessionId, router, qc, trpc.chats.get]);

  const handleWorkflowSelect = useCallback((workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setIsPanelOpen(true);
  }, []);

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedWorkflowId(null);
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

  const showPanel = isPanelOpen && !!selectedWorkflowId;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="min-w-0 flex h-full flex-1 flex-col">
        <ChatRuntime
          sessionId={sessionId}
          initialMessages={[]}
          onWorkflowSelect={handleWorkflowSelect}
          onFirstMessage={handleFirstMessage}
          onStreamFinish={handleStreamFinish}
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
            <ChatWorkflowSidePanel workflowId={selectedWorkflowId} />
          </div>
        </>
      )}
      {isMobile && (
        <Drawer
          open={showPanel}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) handlePanelClose();
          }}
        >
          <DrawerContent className="h-[85vh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Workflow details</DrawerTitle>
            </DrawerHeader>
            <div className="min-h-0 flex-1">
              {selectedWorkflowId && (
                <ChatWorkflowSidePanel workflowId={selectedWorkflowId} showControls={false} />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
