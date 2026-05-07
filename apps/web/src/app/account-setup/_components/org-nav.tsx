"use client";
import { buttonVariants } from "@/components/ui/button";
import { NavigationPosition } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";

export default function OrgNavComponent({ navBtns }: { navBtns: NavigationPosition[] }) {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-center gap-(--sm)">
      {navBtns.map((btn, index) => (
        <div key={index} className="flex items-center gap-(--sm)">
          <Link
            href={btn.href}
            onClick={() => btn.setActive}
            className={twMerge(
              buttonVariants({ variant: "outline" }),

              "cursor-pointer rounded-full border-border",
              btn.active && "border-foreground",
              pathname === btn.href && "border-foreground",
            )}
          >
            {btn.name}
          </Link>
          {index !== navBtns.length - 1 && <div className="h-[2px] w-[32px] bg-border" />}
        </div>
      ))}
    </div>
  );
}
