"use client";

import { type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";
import { useNewChatNavigation } from "@/features/chat/hooks/use-new-chat-navigation";

export function ChatSessionLayout({ children }: { children: ReactNode }) {
  const handleNewSession = useNewChatNavigation();

  return (
    <DashboardLayout
      contentScroll={false}
      header={
        <DashboardHeader
          title="Mirrorpilot"
          actions={
            <div className="flex gap-(--sm)">
              <Button onClick={handleNewSession} className="cursor-pointer">
                <Plus />
                New Chat
              </Button>
            </div>
          }
        />
      }
    >
      <div className="min-h-0 flex w-full flex-1 flex-col">{children}</div>
    </DashboardLayout>
  );
}
