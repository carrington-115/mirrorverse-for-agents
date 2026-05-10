import type { ReactNode } from "react";

interface DashboardLayoutProps {
  header: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ header, children }: DashboardLayoutProps) {
  return (
    <div className="w-full bg-background">
      <div className="top-0 sticky w-full bg-background">{header}</div>
      <div className="flex w-full flex-col items-center justify-center gap-(--xl) pt-[60px] pb-(--xl)">
        {children}
      </div>
    </div>
  );
}
