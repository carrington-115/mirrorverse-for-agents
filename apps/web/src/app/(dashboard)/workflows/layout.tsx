"use client";

import DashboardHeader from "@/components/custom/DashboardHeader";
import DashboardLayout from "@/components/custom/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Workflow } from "lucide-react";
import { toast } from "sonner";

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-[calc(100%-16px)] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] border border-border relative overflow-y-scroll my-[6px] mx-[8px] rounded-lg">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Workflows"
            icon={<Workflow size={16} />}
            actions={
              <Button
                className="cursor-pointer"
                onClick={() => toast.info("Create workflow coming soon")}
              >
                <Plus />
                New workflow
              </Button>
            }
          />
        }
      >
        <div className="w-[90%] flex flex-col gap-[var(--xl)] items-center !pt-0 p-[var(--lg)]">
          {children}
        </div>
      </DashboardLayout>
    </div>
  );
}
