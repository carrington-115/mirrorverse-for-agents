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
        "bottom-0 left-0 right-0 lg:hidden mt-(--spacing-20) hidden size-full flex-col justify-between",
        isOpen && "flex",
      )}
      style={{ transition: "height 1s cubic-bezier(0.4,0,0.2,1)" }}
    >
      <nav>
        <ul className="flex flex-col gap-[24px]">
          {navLinks.map((link) => {
            if (link.product) {
              const items = [...link.product.left, ...link.product.right];
              return (
                <li key={link.label} className="list-none">
                  <span className="text-xs font-semibold tracking-widest text-(--unofficial-foreground-alt,#404040) uppercase dark:text-(--colors-black-30)">
                    {link.label}
                  </span>
                  <ul className="mt-[10px] flex flex-col gap-[12px]">
                    {items.map((item) => (
                      <li key={item.href} className="list-none">
                        <Link
                          href={item.href}
                          className="text-xl sm:text-2xl font-medium text-(--colors-primary) dark:text-(--colors-black-5)"
                          onClick={triggerCloseAction}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }

            if (link.useCases) {
              const items = [...link.useCases.left, ...link.useCases.right];
              return (
                <li key={link.label} className="list-none">
                  <span className="text-xs font-semibold tracking-widest text-(--unofficial-foreground-alt,#404040) uppercase dark:text-(--colors-black-30)">
                    {link.label}
                  </span>
                  <ul className="mt-[10px] flex flex-col gap-[12px]">
                    {items.map((item) => (
                      <li key={item.href} className="list-none">
                        <Link
                          href={item.href}
                          className="text-xl sm:text-2xl font-medium text-(--colors-primary) dark:text-(--colors-black-5)"
                          onClick={triggerCloseAction}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }

            if (link.children) {
              return (
                <li key={link.label} className="list-none">
                  <span className="text-xs font-semibold tracking-widest text-(--unofficial-foreground-alt,#404040) uppercase dark:text-(--colors-black-30)">
                    {link.label}
                  </span>
                  <ul className="mt-[10px] flex flex-col gap-[12px]">
                    {link.children.map((child) => (
                      <li key={child.href} className="list-none">
                        <Link
                          href={child.href}
                          className="text-xl sm:text-2xl font-medium text-(--colors-primary) dark:text-(--colors-black-5)"
                          onClick={triggerCloseAction}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }

            if (link.href) {
              return (
                <li key={link.label} className="list-none">
                  <Link
                    href={link.href}
                    className="text-xl sm:text-2xl font-medium text-(--colors-primary) dark:text-(--colors-black-5)"
                    onClick={triggerCloseAction}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            }

            return null;
          })}
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
