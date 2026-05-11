"use client";

import { useState } from "react";
import { Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";
import { ManageIntegrationsDialog } from "@/features/integrations/components/integration";

export function IntegrationsListLayout({ children }: { children: React.ReactNode }) {
  const [browseOpen, setBrowseOpen] = useState(false);

  return (
    <div className="relative mx-[8px] my-[6px] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] max-w-[calc(100%-16px)] overflow-y-scroll rounded-lg border border-border">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Integrations"
            actions={
              <Button
                variant="secondary"
                className="cursor-pointer"
                onClick={() => setBrowseOpen(true)}
              >
                <Shapes className="size-4" />
                Browse integrations
              </Button>
            }
          />
        }
      >
        <div className="pt-0! flex w-[90%] flex-col items-center gap-(--xl) p-(--lg)">
          {children}
        </div>
      </DashboardLayout>

      <ManageIntegrationsDialog open={browseOpen} onOpenChange={setBrowseOpen} />
    </div>
  );
}
