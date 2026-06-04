"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { navLinks } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button";
import type { mobileLinksTypes } from "@/lib/types";

export default function MobileLinks({ isOpen, triggerCloseAction }: mobileLinksTypes) {
  return (
    <div
      className={cn(
        "bottom-0 left-0 right-0 lg:hidden mb-4 pt-4 mt-(--spacing-20) hidden size-full h-[100vh] flex-col justify-between overflow-y-scroll",
        isOpen && "flex",
      )}
      style={{ transition: "height 1s cubic-bezier(0.4,0,0.2,1)" }}
    >
      <nav>
        <ul className="flex flex-col gap-[24px]">
          {navLinks.map((link) => (
            <li key={link.label} className="list-none">
              <Link
                href={link.href}
                className="text-xl sm:text-2xl font-medium text-(--colors-primary) dark:text-(--colors-black-5)"
                onClick={triggerCloseAction}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 flex flex-col gap-[12px] pb-(--spacing-20)">
        <Link
          href="https://cal.com/frumark/mirrroagents"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full justify-center",
          )}
          target="_blank"
          rel="noopener noreferrer"
          onClick={triggerCloseAction}
        >
          Book a demo
        </Link>
        <Link
          href="https://work.mirrro.io"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "w-full justify-center",
          )}
          onClick={triggerCloseAction}
        >
          Try for free
        </Link>
      </div>
    </div>
  );
}
