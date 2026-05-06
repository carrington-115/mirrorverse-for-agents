import DashboardHeader from "@/components/custom/DashboardHeader";
import DashboardLayout from "@/components/custom/DashboardLayout";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Plus } from "lucide-react";
import DashboardTop from "./_components/DashboardTop";

export default function DashboardPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[calc(100%-16px)] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] border border-border relative overflow-y-scroll my-[6px] mx-[8px] rounded-lg">
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
        <div className="w-[80%] flex flex-col gap-[var(--xl)] justify-center items-center p-[var(--lg)] border-6 border-[var(--border-1)] rounded-lg">
          {children}
        </div>
      </DashboardLayout>
    </div>
  );
}
