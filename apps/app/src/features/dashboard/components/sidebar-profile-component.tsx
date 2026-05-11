"use client";

import { useTransition } from "react";
import { Ellipsis, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { signOutAction } from "@/features/auth/actions/sign-out";

interface SidebarProfileProps {
  name: string;
  email: string;
  image: string;
}

export function SidebarProfileComponent({ name, email, image }: SidebarProfileProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isSigningOut, startSignOut] = useTransition();

  const handleSignOut = () => {
    startSignOut(async () => {
      try {
        await signOutAction();
      } catch (error) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
        toast.error(error instanceof Error ? error.message : "Failed to sign out");
      }
    });
  };

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                className="flex cursor-pointer items-center justify-center rounded-full"
                aria-label={name}
                data-testid="user-menu-trigger"
              >
                <Avatar size="sm">
                  <AvatarImage src={image} />
                  <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{name}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>User guide</DropdownMenuItem>
            <DropdownMenuItem>Contact</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="text-red-500"
              data-testid="sign-out"
              onSelect={(event) => {
                event.preventDefault();
                handleSignOut();
              }}
              disabled={isSigningOut}
            >
              {isSigningOut && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex w-full items-center justify-between rounded-sm p-(--2xs) hover:bg-(--accent)">
      <div className="min-w-0 flex flex-1 items-center gap-(--xs)">
        <Avatar className="shrink-0">
          <AvatarImage src={image} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs truncate text-muted-foreground">{email}</p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={"icon"}
            variant={"ghost"}
            className="cursor-pointer"
            aria-label="Open user menu"
            data-testid="user-menu-trigger"
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-(--radix-popper-anchor-width)">
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>User guide</DropdownMenuItem>
            <DropdownMenuItem>Contact</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="text-red-500"
              data-testid="sign-out"
              onSelect={(event) => {
                event.preventDefault();
                handleSignOut();
              }}
              disabled={isSigningOut}
            >
              {isSigningOut && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
