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
import { MessageCirclePlus, Shapes, Workflow as WorkflowIcon, Megaphone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import SidebarProfileComponent from "./sidebar-profile-component";
import SidebarActivityButton from "./sidebar-activity-button";
import SidebarHeaderComponent from "./sidebar-header";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { generateSessionId } from "@/app/(dashboard)/mirrropilot/actions";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import type { UserMetadata } from "@supabase/supabase-js";

export default function DashboardSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user } = useSupabaseUser();

  // user_metadata is user-editable — display only, never trust for authorization.
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
      </SidebarHeader>

      <SidebarContent className={cn(isCollapsed && "ml-[.5rem] w-full")}>
        <SidebarGroup className={cn(isCollapsed && "p-0")}>
          <SidebarGroupContent>
            <SidebarMenu>
              <NewChatButton />
              <SidebarActivityButton href="/workflows" name="Workflows" icon={WorkflowIcon} />
              <SidebarActivityButton href="/integrations" name="Integrations" icon={Shapes} />
              <ChannelsItem />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && <ConversationsSection />}
      </SidebarContent>

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

  const handleNewChatClick = async () => {
    const sessionId = await generateSessionId();
    router.push(`/mirrropilot/${sessionId}`);
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
  return (
    <SidebarActivityButton
      href="/deploy/phone"
      name="Channels"
      icon={Megaphone}
      sub={[
        { name: "Phone", url: "/deploy/phone" },
        { name: "WhatsApp", url: "/deploy/whatsapp" },
      ]}
    />
  );
}

type Conversation = {
  id: string;
  title: string;
};

function ConversationsSection({ conversations = [] }: { conversations?: Conversation[] }) {
  if (conversations.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Conversations</SidebarGroupLabel>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Conversations</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {conversations.map((c) => (
            <SidebarMenuItem key={c.id}>
              <SidebarActivityButton href={`/mirrropilot/${c.id}`} name={c.title} exact />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
