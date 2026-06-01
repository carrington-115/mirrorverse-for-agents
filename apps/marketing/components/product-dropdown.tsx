"use client";

import Image from "next/image";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@mirrorverse/ui/components/navigation-menu";
import type { ProductItem, UseCasesBanner } from "@/lib/types";

interface ProductDropdownProps {
  label: string;
  left: ProductItem[];
  right: ProductItem[];
  banner: UseCasesBanner;
}

function ProductLink({ item }: { item: ProductItem }) {
  return (
    <Link
      href={item.href}
      className="group flex flex-col rounded-[8px] px-[12px] py-[10px] transition-colors hover:bg-(--colors-primary)/10"
    >
      <span className="font-medium text-[13px] leading-[18px] text-(--general-secondary-foreground,#171717) transition-colors group-hover:text-(--colors-primary) dark:text-(--colors-black-5) dark:group-hover:text-(--base-white)">
        {item.title}
      </span>
      <span className="mt-[2px] text-[12px] leading-[16px] text-(--unofficial-foreground-alt,#404040) dark:text-(--colors-black-30)">
        {item.description}
      </span>
    </Link>
  );
}

export function ProductDropdown({ label, left, right, banner }: ProductDropdownProps) {
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="font-medium h-auto bg-transparent px-[8px] py-[4px] text-[14px] leading-[20px] whitespace-nowrap text-(--foreground-alt) hover:bg-transparent hover:text-(--colors-primary) focus:bg-transparent data-popup-open:bg-transparent dark:text-(--colors-black-20) dark:hover:text-(--base-white) data-open:bg-transparent">
            {label}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="!bg-white !shadow-md !mt-[8px] flex !w-[560px] flex-col gap-[16px] !rounded-[12px] border border-(--border,#e5e5e5) !p-[16px] dark:border-(--colors-black-70) dark:!bg-(--colors-black-90)">
            {/* Top section — two columns */}
            <div className="grid grid-cols-2 gap-[4px]">
              <div className="flex flex-col gap-[2px]">
                {left.map((item) => (
                  <ProductLink key={item.href} item={item} />
                ))}
              </div>
              <div className="flex flex-col gap-[2px]">
                {right.map((item) => (
                  <ProductLink key={item.href} item={item} />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-(--border,#e5e5e5) dark:bg-(--colors-black-70)" />

            {/* Bottom section — product promo */}
            <Link
              href={banner.href}
              className="group hover:shadow-sm flex items-center gap-[16px] rounded-[10px] bg-(--colors-black-5) px-[16px] py-[12px] transition-all hover:bg-(--colors-black-10) dark:bg-(--colors-black-80) dark:hover:bg-(--colors-black-70)"
            >
              <div className="flex-1">
                <span className="font-semibold block text-[14px] leading-[20px] text-(--general-secondary-foreground,#171717) transition-colors group-hover:text-(--colors-primary) dark:text-(--colors-black-5) dark:group-hover:text-(--base-white)">
                  {banner.title}
                </span>
                <p className="mt-[4px] text-[12px] leading-[16px] text-(--unofficial-foreground-alt,#404040) dark:text-(--colors-black-30)">
                  {banner.description}
                </p>
              </div>
              <div className="relative h-[64px] w-[100px] shrink-0 overflow-hidden rounded-[8px]">
                <Image src={banner.image} alt={banner.title} fill className="object-cover" />
              </div>
            </Link>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
