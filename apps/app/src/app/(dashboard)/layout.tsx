import DashboardSidebar from "@/components/custom/dashboard-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

// Sidebar reads the Supabase session via useSupabaseUser, which calls
// createBrowserClient at module init. That can't run during static prerender
// without real env vars, so opt every dashboard route out of static rendering.
export const dynamic = "force-dynamic";

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
