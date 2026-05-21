"use client";

import type { ReactNode } from "react";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";

interface ChannelsShellLayoutProps {
  contentWidth?: string;
  children: ReactNode;
}

export function ChannelsShellLayout({ contentWidth = "90%", children }: ChannelsShellLayoutProps) {
  return (
    <DashboardLayout header={<DashboardHeader title="Channels" />}>
      <div
        className="flex flex-col items-center gap-(--xl) p-(--lg)"
        style={{ width: contentWidth }}
      >
        {children}
      </div>
    </DashboardLayout>
  );
}

export function PhoneShellLayout({ children }: { children: ReactNode }) {
  return <ChannelsShellLayout contentWidth="90%">{children}</ChannelsShellLayout>;
}

export function WhatsAppShellLayout({ children }: { children: ReactNode }) {
  return <ChannelsShellLayout contentWidth="80%">{children}</ChannelsShellLayout>;
}
