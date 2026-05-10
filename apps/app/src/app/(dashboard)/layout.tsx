import DashboardSidebar from "@/components/custom/dashboard-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
