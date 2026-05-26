"use client";

import Image from "next/image";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/seo/site";
import mirroLogoLight from "@/assets/mirrorpilot-icon.svg";
import mirroLogoDark from "@/assets/mirrorpilot-icon-dark.svg";

function LogoMark() {
  return (
    <div className="group relative shrink-0 cursor-pointer">
      <Image
        src={mirroLogoLight}
        alt={`${siteConfig.name} logo`}
        width={27}
        height={20}
        className="transition-[filter] duration-500 group-hover:brightness-[1.4] group-hover:drop-shadow-[0_0_6px_rgba(0,0,0,0.25)] dark:hidden"
      />
      <Image
        src={mirroLogoDark}
        alt={`${siteConfig.name} logo`}
        width={27}
        height={20}
        className="hidden transition-[filter] duration-500 group-hover:brightness-[1.4] group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.45)] dark:block"
      />
    </div>
  );
}

export function SidebarHeaderComponent() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-1 flex items-center justify-center">
            <LogoMark />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{siteConfig.name}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex w-full items-center gap-(--xs) p-(--2xs)">
      <LogoMark />
      <span className="text-base font-medium truncate text-foreground">{siteConfig.name}</span>
    </div>
  );
}
