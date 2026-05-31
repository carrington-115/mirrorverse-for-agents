"use client";

import Link from "next/link";
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

interface NavDropdownProps {
  label: string;
  items: NavChildLink[];
}

export function NavDropdown({ label, items }: NavDropdownProps) {
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="font-medium h-auto bg-transparent px-[8px] py-[4px] text-[14px] leading-[20px] whitespace-nowrap text-(--foreground-alt) hover:bg-transparent hover:text-(--colors-primary) focus:bg-transparent data-popup-open:bg-transparent dark:text-(--colors-black-20) dark:hover:text-(--base-white) data-open:bg-transparent">
            {label}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="!bg-white !shadow-md !mt-[8px] flex !w-[220px] flex-col gap-[2px] !rounded-[12px] border border-(--border,#e5e5e5) !p-[8px] dark:border-(--colors-black-70) dark:!bg-(--colors-black-90)">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col rounded-[8px] px-[12px] py-[8px] hover:bg-(--colors-black-5) dark:hover:bg-(--colors-black-80)"
              >
                <span className="font-medium text-[14px] leading-[20px] text-(--general-secondary-foreground,#171717) dark:text-(--colors-black-5)">
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-[12px] leading-[16px] text-(--unofficial-foreground-alt,#404040) dark:text-(--colors-black-30)">
                    {item.description}
                  </span>
                )}
              </Link>
            ))}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
