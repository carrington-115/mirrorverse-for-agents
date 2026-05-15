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
    <>
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
        <div className="flex w-[90%] flex-col items-center gap-(--xl) p-(--lg)">{children}</div>
      </DashboardLayout>

      <ManageIntegrationsDialog open={browseOpen} onOpenChange={setBrowseOpen} />
    </>
  );
}
