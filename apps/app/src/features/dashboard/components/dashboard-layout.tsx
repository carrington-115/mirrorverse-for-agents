import type { ReactNode } from "react";

interface DashboardLayoutProps {
  header: ReactNode;
  children: ReactNode;
  /**
   * Whether the page-level content area should scroll. Defaults to true for
   * list/settings pages. Set to false when the child manages its own scroll
   * (e.g. chat conversation), so a second page-level scrollbar doesn't compete
   * with the inner one.
   */
  contentScroll?: boolean;
}

export function DashboardLayout({ header, children, contentScroll = true }: DashboardLayoutProps) {
  return (
    <div className="m-2 relative flex h-[calc(100svh-1rem)] flex-col overflow-hidden rounded-lg border border-border bg-background">
      <div className="shrink-0">{header}</div>
      <div
        className={
          contentScroll
            ? "min-h-0 flex w-full flex-1 flex-col items-center overflow-y-auto"
            : "min-h-0 flex w-full flex-1 flex-col items-center overflow-hidden"
        }
      >
        {children}
      </div>
    </div>
  );
}
