import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsModal } from "@/features/settings/components/settings-modal";
import { SettingsModalProvider } from "@/features/settings/components/settings-modal-provider";
import { DashboardSidebar } from "./dashboard-sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <SidebarProvider>
        <TooltipProvider>
          <SettingsModalProvider>
            <DashboardSidebar />
            <main className="container bg-(--unofficial-body-background)">{children}</main>
            <SettingsModal />
          </SettingsModalProvider>
        </TooltipProvider>
      </SidebarProvider>
    </div>
  );
}
