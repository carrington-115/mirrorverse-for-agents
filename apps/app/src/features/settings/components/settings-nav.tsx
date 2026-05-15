"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppWindow,
  BarChart3,
  Megaphone,
  Receipt,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Zap,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const WORKSPACE_ITEMS = [
  { label: "General", href: "/settings/general", icon: SlidersHorizontal },
  { label: "Pricing", href: "/settings/pricing", icon: Zap },
  { label: "Billing", href: "/settings/billing", icon: Receipt },
  { label: "Usage", href: "/settings/usage", icon: BarChart3 },
  { label: "Security", href: "/settings/security", icon: ShieldCheck },
  { label: "Audit Logs", href: "/settings/audit-logs", icon: ScrollText },
  { label: "Apps", href: "/settings/apps", icon: AppWindow },
  { label: "Channels", href: "/settings/channels", icon: Megaphone },
] as const;

const ACCOUNT_ITEMS = [{ label: "Profile", href: "/settings/profile", icon: User }] as const;

type NavItem = { label: string; href: string; icon: React.ElementType };

function NavLink({ label, href, icon: Icon, isActive }: NavItem & { isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "gap-2 px-3 py-2 text-sm flex items-center rounded-md transition-colors",
        isActive
          ? "font-medium bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="gap-0.5 top-6 sticky flex w-[180px] shrink-0 flex-col self-start">
      {WORKSPACE_ITEMS.map(({ label, href, icon }) => (
        <NavLink
          key={href}
          label={label}
          href={href}
          icon={icon}
          isActive={pathname === href || pathname.startsWith(`${href}/`)}
        />
      ))}

      <div className="py-2">
        <Separator />
      </div>

      <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">Account</p>

      {ACCOUNT_ITEMS.map(({ label, href, icon }) => (
        <NavLink
          key={href}
          label={label}
          href={href}
          icon={icon}
          isActive={pathname === href || pathname.startsWith(`${href}/`)}
        />
      ))}
    </nav>
  );
}
