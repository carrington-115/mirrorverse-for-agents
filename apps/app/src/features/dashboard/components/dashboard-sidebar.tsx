"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Loader2,
  MessageCirclePlus,
  Shapes,
  Workflow as WorkflowIcon,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useSupabaseUser } from "@/features/auth/hooks/use-supabase-user";
import { useChatsListQuery } from "@/features/chat/api/queries";
import type { ChatListEntry } from "@/features/chat/api/server-types";
import { ConversationSidebarItem } from "@/features/chat/components/conversation-sidebar-item";
import { useSettingsModal } from "@/features/settings/hooks/use-settings-modal";
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
              <WorkflowsSidebarButton />
              <SidebarActivityButton href="/knowledge" name="Knowledge" icon={BookOpen} />
              <SidebarActivityButton href="/integrations" name="Integrations" icon={Shapes} />
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

function WorkflowsSidebarButton() {
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { openSettings } = useSettingsModal();

  const handleClick = () => {
    setOpenMobile(false);
    openSettings("workflows");
  };

  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              onClick={handleClick}
              className="flex cursor-pointer items-center justify-center"
            >
              <WorkflowIcon className="size-4" />
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right">Workflows</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={handleClick} className="cursor-pointer">
        <WorkflowIcon className="size-4" />
        <span>Workflows</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NewChatButton() {
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const router = useRouter();
  const pathname = usePathname();

  const handleNewChatClick = () => {
    setOpenMobile(false);
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
