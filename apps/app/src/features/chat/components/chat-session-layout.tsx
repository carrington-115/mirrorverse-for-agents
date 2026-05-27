"use client";

import { type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";

export function ChatSessionLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNewSession = () => {
    // If Next.js thinks the current route is /mirrorpilot, the browser URL may
    // have been silently updated via history.replaceState after the first
    // message was sent. Use a full navigation to guarantee a fresh component
    // tree regardless of that divergence.
    if (pathname === "/mirrorpilot") {
      window.location.href = "/mirrorpilot";
    } else {
      router.push("/mirrorpilot");
    }
  };

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
