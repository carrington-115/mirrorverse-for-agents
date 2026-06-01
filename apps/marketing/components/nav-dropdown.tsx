"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@mirrorverse/ui/components/navigation-menu";

interface NavChildLink {
  label: string;
  href: string;
  description?: string;
}

interface NavFeaturedItem {
  label: string;
  href: string;
  description?: string;
}

interface NavDropdownProps {
  label: string;
  items: NavChildLink[];
  featured?: NavFeaturedItem;
}

export function NavDropdown({ label, items, featured }: NavDropdownProps) {
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="font-medium h-auto bg-transparent px-[8px] py-[4px] text-[14px] leading-[20px] whitespace-nowrap text-(--foreground-alt) hover:bg-transparent hover:text-(--colors-primary) focus:bg-transparent data-popup-open:bg-transparent dark:text-(--colors-black-20) dark:hover:text-(--base-white) data-open:bg-transparent">
            {label}
          </NavigationMenuTrigger>
          <NavigationMenuContent
            className={cn(
              "!bg-white !shadow-md !mt-[8px] flex !rounded-[12px] border border-(--border,#e5e5e5) !p-[8px] dark:border-(--colors-black-70) dark:!bg-(--colors-black-90)",
              featured ? "!w-[420px] flex-row gap-[8px]" : "!w-[220px] flex-col gap-[2px]",
            )}
          >
            {/* Left side — links */}
            <div className="flex flex-1 flex-col gap-[2px]">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col rounded-[8px] px-[12px] py-[8px] transition-colors hover:bg-(--colors-black-5) dark:hover:bg-(--colors-black-80)"
                >
                  <span className="font-medium text-[14px] leading-[20px] text-(--general-secondary-foreground,#171717) transition-colors group-hover:text-(--colors-primary) dark:text-(--colors-black-5) dark:group-hover:text-(--base-white)">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-[12px] leading-[16px] text-(--unofficial-foreground-alt,#404040) dark:text-(--colors-black-30)">
                      {item.description}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Separator */}
            {featured && (
              <div className="w-px shrink-0 self-stretch bg-(--border,#e5e5e5) dark:bg-(--colors-black-70)" />
            )}

            {/* Right side — featured card */}
            {featured && (
              <Link
                href={featured.href}
                className="group hover:shadow-sm flex w-[160px] shrink-0 flex-col justify-between rounded-[10px] bg-(--colors-black-5) p-[12px] transition-all hover:bg-(--colors-black-10) dark:bg-(--colors-black-80) dark:hover:bg-(--colors-black-70)"
              >
                <div>
                  <span className="font-semibold block text-[13px] leading-[18px] text-(--general-secondary-foreground,#171717) transition-colors group-hover:text-(--colors-primary) dark:text-(--colors-black-5) dark:group-hover:text-(--base-white)">
                    {featured.label}
                  </span>
                  {featured.description && (
                    <p className="mt-[6px] text-[11px] leading-[15px] text-(--unofficial-foreground-alt,#404040) dark:text-(--colors-black-30)">
                      {featured.description}
                    </p>
                  )}
                </div>
                <span className="font-medium mt-[12px] text-[12px] text-(--colors-primary) transition-colors group-hover:underline">
                  Read guide →
                </span>
              </Link>
            )}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
