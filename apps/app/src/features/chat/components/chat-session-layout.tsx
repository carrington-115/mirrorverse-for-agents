"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { History, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";
import { generateSessionId } from "@/features/chat/actions/generate-session-id";

export function ChatSessionLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleNewSession = () => {
    startTransition(async () => {
      const newSessionId = await generateSessionId();
      router.push(`/mirropilot/${newSessionId}`);
    });
  };

  const busy = isPending;

  return (
    <DashboardLayout
      contentScroll={false}
      header={
        <DashboardHeader
          title="Mirropilot"
          actions={
            <div className="flex gap-(--sm)">
              <Button onClick={handleNewSession} disabled={busy} className="cursor-pointer">
                {busy ? <Loader2 className="animate-spin" /> : <Plus />}
                New Chat
              </Button>
              <Button variant={"ghost"} size={"icon"} className="cursor-pointer">
                <History />
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
