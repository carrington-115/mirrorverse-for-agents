"use client";

import { Plug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";

export function IntegrationsListLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-[8px] my-[6px] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] max-w-[calc(100%-16px)] overflow-y-scroll rounded-lg border border-border">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Integrations"
            icon={<Plug size={16} />}
            actions={
              <Button
                className="cursor-pointer"
                onClick={() => toast.info("Add integration coming soon")}
              >
                Add integration
              </Button>
            }
          />
        }
      >
        <div className="pt-0! flex w-[90%] flex-col items-center gap-(--xl) p-(--lg)">
          {children}
        </div>
      </DashboardLayout>
    </div>
  );
}
