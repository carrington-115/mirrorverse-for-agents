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
    <div className="relative mx-[8px] my-[6px] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] max-w-[calc(100%-16px)] overflow-y-scroll rounded-lg border border-border">
      <DashboardLayout
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
        <div className="flex h-[calc(87vh-62px)] w-[80%] flex-col items-center gap-(--xl)">
          {children}
        </div>
      </DashboardLayout>
    </div>
  );
}
