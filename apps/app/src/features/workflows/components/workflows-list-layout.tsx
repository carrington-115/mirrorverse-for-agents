"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";

export function WorkflowsListLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      header={
        <DashboardHeader
          title="Workflows"
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
      <div className="flex w-[90%] flex-col items-center gap-(--xl) p-(--lg)">{children}</div>
    </DashboardLayout>
  );
}
