"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCog, Workflow, Layers2, Wrench, Settings2, UserLock, LucideIcon } from "lucide-react";

const TABS: { label: string; slug: string; icon: LucideIcon }[] = [
  { label: "Agent configuration", slug: "configuration", icon: UserCog },
  { label: "Workflows", slug: "workflows", icon: Workflow },
  { label: "Knowledge base", slug: "knowledge-base", icon: Layers2 },
  { label: "Tools", slug: "tools", icon: Wrench },
  { label: "Escalation configuration", slug: "settings", icon: Settings2 },
  { label: "Advanced", slug: "advanced", icon: UserLock },
];

export default function AgentTabNav({ id }: { id: string }) {
  const pathname = usePathname();

  return (
    <div className="flex w-full items-center border-b border-(--border-1)">
      {TABS.map(({ label, slug, icon: Icon }) => {
        const href = `/agent/${id}/${slug}`;
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={slug}
            href={href}
            className={`text-xs -mb-px flex h-[50px] items-center gap-(--2xs) px-(--md) py-(--sm) whitespace-nowrap transition-colors ${
              isActive
                ? "border-b border-[var(--border-3)] text-foreground"
                : "text-[color:var(--foreground-alt)] hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
