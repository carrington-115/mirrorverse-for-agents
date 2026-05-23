"use client";

import type { ReactNode } from "react";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";

export function KnowledgeListLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout header={<DashboardHeader title="Knowledge bases" />}>
      <div className="flex w-[90%] flex-col gap-(--xl) p-(--lg)">{children}</div>
    </DashboardLayout>
  );
}
