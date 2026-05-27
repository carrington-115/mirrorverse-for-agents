"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Loader2,
  Megaphone,
  MessageCirclePlus,
  Phone,
  Shapes,
  Workflow as WorkflowIcon,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { UserMetadata } from "@supabase/supabase-js";
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
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { useSupabaseUser } from "@/features/auth/hooks/use-supabase-user";
import { useChatsListQuery } from "@/features/chat/api/queries";
import type { ChatListEntry } from "@/features/chat/api/server-types";
import { ConversationSidebarItem } from "@/features/chat/components/conversation-sidebar-item";
import { SidebarHeaderComponent } from "./sidebar-header";
import { SidebarProfileComponent } from "./sidebar-profile-component";
import { SidebarActivityButton } from "./sidebar-activity-button";

export function DashboardSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user } = useSupabaseUser();

  const metadata: UserMetadata = user ? user.user_metadata : {};
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
  const fallbackName = typeof metadata.name === "string" ? metadata.name : "";
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : "";
  const fallbackAvatar = typeof metadata.picture === "string" ? metadata.picture : "";
  const email = user && user.email ? user.email : "";

  const displayName =
    fullName.length > 0 ? fullName : fallbackName.length > 0 ? fallbackName : email;
  const displayImage = avatarUrl.length > 0 ? avatarUrl : fallbackAvatar;

  return (
    <Sidebar className={cn("border-none bg-transparent!", isCollapsed && "items-center")}>
      <SidebarHeader>
        <SidebarHeaderComponent />
        <SidebarGroup className={cn(isCollapsed && "p-0")}>
          <SidebarGroupContent>
            <SidebarMenu>
              <NewChatButton />
              <SidebarActivityButton href="/workflows" name="Workflows" icon={WorkflowIcon} />
              <SidebarActivityButton href="/knowledge" name="Knowledge" icon={BookOpen} />
              <SidebarActivityButton href="/integrations" name="Integrations" icon={Shapes} />
              <ChannelsItem />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      {isCollapsed ? (
        <div className="flex-1" />
      ) : (
        <SidebarContent className="overflow-y-auto">
          <ConversationsSection />
        </SidebarContent>
      )}

      <SidebarFooter>
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          <SidebarGroupContent>
            <SidebarProfileComponent name={displayName} email={email} image={displayImage} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

function NewChatButton() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const router = useRouter();
  const pathname = usePathname();

  const handleNewChatClick = () => {
    // When already on /mirrorpilot, the URL may have been silently updated via
    // history.replaceState after the first message was sent. A full reload
    // guarantees a clean component tree in either case (same as the header button).
    if (pathname === "/mirrorpilot") {
      window.location.href = "/mirrorpilot";
    } else {
      router.push("/mirrorpilot");
    }
  };

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              onClick={handleNewChatClick}
              className="flex cursor-pointer items-center justify-center"
            >
              <MessageCirclePlus className="size-4 shrink-0" />
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right">New chat</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={handleNewChatClick} className="w-full cursor-pointer">
        <MessageCirclePlus className="size-4 shrink-0" />
        <span>New chat</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function ChannelsItem() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <HoverCard openDelay={120} closeDelay={120}>
      <SidebarMenuItem>
        <HoverCardTrigger asChild>
          <SidebarMenuButton
            className={cn(isCollapsed && "flex items-center justify-center")}
            tooltip={isCollapsed ? "Channels" : undefined}
          >
            <Megaphone className="size-4" />
            {!isCollapsed && <span>Channels</span>}
          </SidebarMenuButton>
        </HoverCardTrigger>
      </SidebarMenuItem>
      <HoverCardContent side="right" align="start" className="w-48 p-1">
        <Link
          href="/deploy/phone"
          className="gap-2 px-2 py-1.5 text-sm flex items-center rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <Phone className="size-4" />
          <span>Phone</span>
        </Link>
        <Link
          href="/deploy/whatsapp"
          className="gap-2 px-2 py-1.5 text-sm flex items-center rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <SiWhatsapp className="size-4" />
          <span>WhatsApp</span>
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
}

function titleFor(entry: ChatListEntry): string {
  if (entry.title && entry.title.trim().length > 0) return entry.title;
  return "Greeting Exchange";
}

function ConversationsSection() {
  const { data, isLoading } = useChatsListQuery();
  const conversations = data ?? [];

  if (isLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Conversations</SidebarGroupLabel>
        <div className="py-2 flex justify-center">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      </SidebarGroup>
    );
  }

  if (conversations.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Conversations</SidebarGroupLabel>
        <p className="px-2 text-xs text-muted-foreground">No chats yet.</p>
      </SidebarGroup>
    );
  }

  const pinned = conversations.filter((c) => c.isPinned);
  const unpinned = conversations.filter((c) => !c.isPinned);

  return (
    <>
      {pinned.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Pinned chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-px">
              {pinned.map((c) => (
                <SidebarMenuItem key={c.id}>
                  <ConversationSidebarItem chatId={c.id} title={titleFor(c)} isPinned={true} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
      <SidebarGroup>
        <SidebarGroupLabel>Conversations</SidebarGroupLabel>
        {unpinned.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">No unpinned chats.</p>
        ) : (
          <SidebarGroupContent>
            <SidebarMenu className="gap-px">
              {unpinned.map((c) => (
                <SidebarMenuItem key={c.id}>
                  <ConversationSidebarItem chatId={c.id} title={titleFor(c)} isPinned={false} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        )}
      </SidebarGroup>
    </>
  );
}
