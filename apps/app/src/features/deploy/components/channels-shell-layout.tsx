"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";

interface ChannelsShellLayoutProps {
  contentWidth?: string;
  children: ReactNode;
}

export function ChannelsShellLayout({ contentWidth = "90%", children }: ChannelsShellLayoutProps) {
  return (
    <div className="relative mx-[8px] my-[6px] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] max-w-[calc(100%-16px)] overflow-y-scroll rounded-lg border border-border">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Channels"
            actions={
              <Button
                className="cursor-pointer"
                onClick={() => toast.info("Channel configuration coming soon")}
              >
                Configure channel
              </Button>
            }
          />
        }
      >
        <div
          className="pt-0! flex flex-col items-center gap-(--xl) p-(--lg)"
          style={{ width: contentWidth }}
        >
          {children}
        </div>
      </DashboardLayout>
    </div>
  );
}

export function PhoneShellLayout({ children }: { children: ReactNode }) {
  return <ChannelsShellLayout contentWidth="90%">{children}</ChannelsShellLayout>;
}

export function WhatsAppShellLayout({ children }: { children: ReactNode }) {
  return <ChannelsShellLayout contentWidth="80%">{children}</ChannelsShellLayout>;
}
