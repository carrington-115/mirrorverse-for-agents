import DashboardHeader from "@/components/custom/dashboard-header";
import DashboardLayout from "@/components/custom/dashboard-layout";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Plus } from "lucide-react";
import DashboardTop from "./_components/dashboard-top";

export default function DashboardPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-[8px] my-[6px] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] max-w-[calc(100%-16px)] overflow-y-scroll rounded-lg border border-border">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Dashboard"
            icon={<LayoutDashboard size={16} />}
            actions={
              <Button>
                <Plus /> New agent
              </Button>
            }
          />
        }
      >
        <DashboardTop />
        <div className="flex w-[80%] flex-col items-center justify-center gap-(--xl) rounded-lg border-6 border-(--border-1) p-(--lg)">
          {children}
        </div>
      </DashboardLayout>
    </div>
  );
}
