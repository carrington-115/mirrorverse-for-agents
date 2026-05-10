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
    <div className="gap-0.5 p-0.5 flex w-fit items-center rounded-[10px] bg-accent">
      {TABS.map(({ label, slug, icon: Icon }) => {
        const href = `/deploy/phone/${id}/${slug}`;
        const isActive = pathname === href;
        return (
          <Link
            key={slug}
            href={href}
            className={`gap-1.5 px-3 py-1.5 text-sm font-medium flex items-center rounded-[10px] transition-colors ${
              isActive
                ? "shadow-sm bg-background text-foreground"
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
