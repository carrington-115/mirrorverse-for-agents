import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardSidebar } from "./dashboard-sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <SidebarProvider>
        <TooltipProvider>
          <DashboardSidebar />
          <main className="container bg-(--unofficial-body-background)">{children}</main>
        </TooltipProvider>
      </SidebarProvider>
    </div>
  );
}
