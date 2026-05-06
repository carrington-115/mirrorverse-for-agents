"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import { sidebarData } from "@/lib/data";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import SidebarProfileComponent from "./SidebarProfileComponent";
import SidebarActivityButton from "./SidebarActivityButton";
import mirrropilotIcon from "@/assets/mirrropilot-icon.svg";
import Image from "next/image";
import SidebarHeaderComponent from "./SidebarHeader";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateSessionId } from "@/app/(dashboard)/mirrropilot/actions";

export default function DashboardSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  return (
    <Sidebar
      className={cn(
        "!bg-transparent border-none",
        isCollapsed && "items-center",
      )}
    >
      <SidebarHeader>
        <SidebarHeaderComponent />
      </SidebarHeader>

      <SidebarContent className={cn(isCollapsed && "w-full ml-[.5rem]")}>
        {isCollapsed ? (
          <>
            <DashboardSection />
            <MirroPilotButton />
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <DashboardSection />
              <MirroPilotButton />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarDataGroups />
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          <SidebarGroupContent>
            <SidebarProfileComponent
              name="John Doe"
              email="john@test.com"
              image="https://github.com/shadcn.png"
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarDataGroups() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return (
      <SidebarGroup className="p-0">
        <SidebarGroupContent>
          <SidebarMenu>
            {sidebarData.flatMap((group) =>
              group.actions.map((action) => (
                <SidebarActivityButton
                  key={action.name}
                  href={action.url}
                  name={action.name}
                  icon={action.icon}
                  sub={action.sub}
                />
              )),
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      {sidebarData.map((group) => (
        <SidebarGroup key={group.name}>
          <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.actions.map((action) => (
                <SidebarActivityButton
                  key={action.name}
                  href={action.url}
                  name={action.name}
                  icon={action.icon}
                  sub={action.sub}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

function DashboardSection() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();

  if (isCollapsed) {
    return (
      <SidebarGroup className="p-0">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarActivityButton
                href="/dashboard"
                name="Dashboard"
                icon={LayoutDashboard}
                exact
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <Link href="/dashboard" className="w-full">
            <SidebarMenuButton
              className={cn(
                "w-full",
                pathname === "/dashboard" && "bg-sidebar-accent",
              )}
            >
              <LayoutDashboard />
              <span>Dashboard</span>
              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarMenuButton>
          </Link>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent className="ml-[1rem] border-l border-border pl-[.5rem]">
            <SidebarMenu className="max-w-[80%]">
              <SidebarMenuItem>
                <SidebarActivityButton
                  href="/dashboard/analytics"
                  name="Analytics"
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarActivityButton
                  href="/dashboard/monitor"
                  name="Monitor"
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function MirroPilotButton() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const pathname = usePathname();
  const router = useRouter();

  const handleMirrropilotClick = async () => {
    if (pathname.startsWith("/mirrropilot")) {
      return;
    }

    const sessionId = await generateSessionId();
    router.push(`/mirrropilot/${sessionId}`);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={handleMirrropilotClick}
        className={cn(
          "w-full cursor-pointer",
          isCollapsed && "w-full",
          pathname.startsWith("/mirrropilot") && "bg-sidebar-accent",
        )}
      >
        <Image
          src={mirrropilotIcon}
          alt="mirrropilot-icon"
          width={24}
          height={18}
        />
        <span className={cn(isCollapsed && "hidden")}>Mirrropilot</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
