import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Archive, ChartLine, Layers2, Monitor, ShieldUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "General", href: "/dashboard", icon: <Layers2 /> },
  { label: "Analytics", href: "/dashboard/analytics", icon: <ChartLine /> },
  { label: "Monitor", href: "/dashboard/monitor", icon: <Monitor /> },
  { label: "Advanced", href: "/dashboard/advanced", icon: <ShieldUser /> },
];

export default function DashboardTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center p-[3px] bg-accent rounded-sm">
      {TABS.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          className={cn(
            buttonVariants({
              variant: "ghost",
              size: "sm",
            }),
            pathname === tab.href && "bg-background text-foreground shadow-sm",
          )}
        >
          {tab.icon} {tab.label}
        </Link>
      ))}
    </div>
  );
}
