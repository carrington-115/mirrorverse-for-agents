interface DashboardLayoutProps {
  header: React.ReactNode;
  children: React.ReactNode;
}

export default function DashboardLayout({
  header,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="w-full bg-background">
      <div className="w-full sticky top-0 bg-background">{header}</div>
      <div className="w-full flex flex-col gap-[var(--xl)] justify-center items-center pt-[60px] pb-[var(--xl)]">
        {children}
      </div>
    </div>
  );
}
