import type { ReactNode } from "react";

interface DashboardLayoutProps {
  header: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ header, children }: DashboardLayoutProps) {
  return (
    <div className="m-2 relative flex h-[calc(100svh-1rem)] flex-col overflow-hidden rounded-lg border border-border bg-background">
      <div className="shrink-0">{header}</div>
      <div className="min-h-0 flex w-full flex-1 flex-col items-center overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
