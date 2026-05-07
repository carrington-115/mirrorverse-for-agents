"use client";

import DashboardHeader from "@/components/custom/dashboard-header";
import DashboardLayout from "@/components/custom/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Shapes } from "lucide-react";
import { useState } from "react";
import { ManageIntegrationsDialog } from "./_components/integration";

export default function DashboardPage({ children }: { children: React.ReactNode }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <div className="relative mx-[8px] my-[6px] h-[calc(100vh-12px)] max-h-[calc(100%-12px)] max-w-[calc(100%-16px)] overflow-y-scroll rounded-lg border border-border">
      <DashboardLayout
        header={
          <DashboardHeader
            title="Integrations"
            icon={<Shapes size={16} />}
            actions={
              <Button className="cursor-pointer" onClick={() => setDialogOpen(true)}>
                Manage integration
              </Button>
            }
          />
        }
      >
        <div className="pt-0! flex w-[80%] flex-col items-center gap-(--xl) p-(--lg)">
          {children}
        </div>
      </DashboardLayout>
      <ManageIntegrationsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
