"use client";

import Image from "next/image";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/seo/site";
import mirroLogo from "@/assets/mirropilot-icon.svg";

export function SidebarHeaderComponent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-1 flex items-center justify-center">
            <Image
              src={mirroLogo}
              alt={`${siteConfig.name} logo`}
              width={27}
              height={20}
              className="shrink-0"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{siteConfig.name}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex w-full items-center gap-(--xs) p-(--2xs)">
      <Image
        src={mirroLogo}
        alt={`${siteConfig.name} logo`}
        width={27}
        height={20}
        className="shrink-0"
      />
      <span className="text-base font-medium truncate text-foreground">{siteConfig.name}</span>
    </div>
  );
}
