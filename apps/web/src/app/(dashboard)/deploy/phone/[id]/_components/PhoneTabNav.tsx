"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Captions, BarChart2, Activity } from "lucide-react";

const TABS = [
  { label: "Call logs", slug: "call-logs", icon: Phone },
  { label: "Transcripts", slug: "transcripts", icon: Captions },
  { label: "Analytics", slug: "analytics", icon: BarChart2 },
  { label: "Usage", slug: "usage", icon: Activity },
] as const;

export default function PhoneTabNav({ id }: { id: string }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-0.5 bg-accent p-0.5 rounded-[10px] w-fit">
      {TABS.map(({ label, slug, icon: Icon }) => {
        const href = `/deploy/phone/${id}/${slug}`;
        const isActive = pathname === href;
        return (
          <Link
            key={slug}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
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
