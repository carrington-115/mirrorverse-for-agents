"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { SidebarSubItem } from "@/lib/data";

interface SidebarActivityButtonProps {
  href: string;
  name: string;
  icon?: React.ElementType;
  sub?: SidebarSubItem[];
  className?: string;
  exact?: boolean;
  children?: React.ReactNode;
}

export function SidebarActivityButton({
  href,
  name,
  icon: Icon,
  sub,
  className,
  exact = false,
  children,
}: SidebarActivityButtonProps) {
  const pathname = usePathname();
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const closeMobileSidebar = () => setOpenMobile(false);

  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  if (sub && sub.length > 0) {
    if (isCollapsed) {
      return (
        <SidebarMenuItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn("flex items-center justify-center", className)}
              >
                <Link href={href} onClick={closeMobileSidebar}>
                  {Icon && <Icon className="size-4" />}
                </Link>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">{name}</TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      );
    }

    return (
      <Collapsible className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className={cn(className)}>
              {Icon && <Icon className="size-4" />}
              <span>{name}</span>
              <ChevronDown className="size-4 ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent>
          <SidebarGroupContent className="pl-4 ml-2 border-l border-border">
            {sub.map((subItem) => (
              <SidebarMenuItem key={subItem.name}>
                <SidebarActivityButton href={subItem.url} name={subItem.name} />
              </SidebarMenuItem>
            ))}
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  if (isCollapsed) {
    return (
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn("flex items-center justify-center", className)}
        tooltip={name}
      >
        <Link href={href} onClick={closeMobileSidebar}>
          {Icon && <Icon className="size-4" />}
          {children}
        </Link>
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuButton asChild isActive={isActive} className={cn(className)}>
      <Link href={href} onClick={closeMobileSidebar}>
        {Icon && <Icon className="size-4" />}
        <span>{name}</span>
        {children}
      </Link>
    </SidebarMenuButton>
  );
}
