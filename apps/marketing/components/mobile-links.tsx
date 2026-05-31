"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { navLinks } from "@/lib/data";
import { buttonVariants } from "@/components/ui/button";
import type { mobileLinksTypes } from "@/lib/types";

export default function MobileLinks({ isOpen, triggerCloseAction }: mobileLinksTypes) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "bottom-0 left-0 right-0 lg:hidden mt-(--spacing-20) hidden size-full flex-col justify-between",
        isOpen && "flex",
      )}
      style={{ transition: "height 1s cubic-bezier(0.4,0,0.2,1)" }}
    >
      <nav>
        <ul className="flex flex-col gap-[5px]">
          {navLinks.map((link) => (
            <li key={link.label} className="list-none">
              {link.children ? (
                <div>
                  <button
                    onClick={() => setOpenGroup(openGroup === link.label ? null : link.label)}
                    className="text-2xl sm:text-3xl flex items-center gap-[8px] text-(--colors-primary) dark:text-(--colors-black-5)"
                  >
                    {link.label}
                    <ChevronDown
                      size={28}
                      className={cn(
                        "transition-transform duration-200",
                        openGroup === link.label && "rotate-180",
                      )}
                    />
                  </button>
                  {openGroup === link.label && (
                    <ul className="mt-[8px] ml-[16px] flex flex-col gap-[4px]">
                      {link.children.map((child) => (
                        <li key={child.href} className="list-none">
                          <Link
                            href={child.href}
                            className="text-lg sm:text-xl text-(--unofficial-foreground-alt,#404040) dark:text-(--colors-black-20)"
                            onClick={triggerCloseAction}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : link.href ? (
                <Link
                  href={link.href}
                  className="text-2xl sm:text-3xl text-(--colors-primary) dark:text-(--colors-black-5)"
                  onClick={triggerCloseAction}
                >
                  {link.label}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-[12px] pb-(--spacing-20)">
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
          href="#"
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
