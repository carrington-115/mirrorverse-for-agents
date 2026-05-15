"use client";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";

export function WorkflowsListLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout header={<DashboardHeader title="Workflows" />}>
      <div className="flex w-[90%] flex-col items-center gap-(--xl) p-(--lg)">{children}</div>
    </DashboardLayout>
  );
}
