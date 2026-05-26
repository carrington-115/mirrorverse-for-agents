"use client";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";

export function IntegrationsListLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout header={<DashboardHeader title="Integrations" />}>
      <div className="md:w-[90%] flex w-[95%] flex-col items-center gap-(--xl) p-(--lg)">
        {children}
      </div>
    </DashboardLayout>
  );
}
