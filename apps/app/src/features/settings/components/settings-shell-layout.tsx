import type { ReactNode } from "react";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { SettingsNav } from "./settings-nav";

export function SettingsShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-[8px] my-[6px] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] max-w-[calc(100%-16px)] overflow-y-auto rounded-lg border border-border bg-background">
      <div className="top-0 sticky z-10 bg-background">
        <DashboardHeader title="Settings" />
      </div>
      <div className="gap-8 px-6 py-6 flex flex-row">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
