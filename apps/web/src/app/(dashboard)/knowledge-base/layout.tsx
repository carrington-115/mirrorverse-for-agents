import DashboardHeader from "@/components/custom/DashboardHeader";
import DashboardLayout from "@/components/custom/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Folder, Plus } from "lucide-react";

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
            title="Knowledge base"
            icon={<Folder size={16} />}
            actions={
              <Button>
                <Plus /> Create folder
              </Button>
            }
          />
        }
      >
        <div className="w-[80%] flex flex-col gap-[var(--xl)] items-center !pt-0 p-[var(--lg)]">
          {children}
        </div>
      </DashboardLayout>
    </div>
  );
}
