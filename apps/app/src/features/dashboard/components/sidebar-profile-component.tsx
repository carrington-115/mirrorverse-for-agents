"use client";

import { useTransition } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  BarChart3Icon,
  Check,
  CreditCardIcon,
  Ellipsis,
  HelpCircleIcon,
  Loader2,
  MegaphoneIcon,
  SettingsIcon,
  SunMoon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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

function AppearanceSubmenu() {
  const { theme, setTheme } = useTheme();
  const options = ["light", "dark", "system"] as const;
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <SunMoon className="mr-2 size-4" />
        Appearance
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {options.map((t) => (
          <DropdownMenuItem key={t} onSelect={() => setTheme(t)}>
            <Check className={`mr-2 size-3 ${theme === t ? "opacity-100" : "opacity-0"}`} />
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function ProfileHeader({ name, email, image }: SidebarProfileProps) {
  return (
    <div className="gap-3 px-3 py-2.5 flex items-center">
      <Avatar size="lg">
        <AvatarImage src={image} />
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs truncate text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}

function ProfileMenuItems({
  onSignOut,
  isSigningOut,
}: {
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <UserIcon className="mr-2 size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/billing">
            <CreditCardIcon className="mr-2 size-4" />
            Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/usage">
            <BarChart3Icon className="mr-2 size-4" />
            Usage
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <AppearanceSubmenu />
        <DropdownMenuItem asChild>
          <Link href="/settings/general">
            <SettingsIcon className="mr-2 size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="mailto:support@mirrorverse.ai">
            <HelpCircleIcon className="mr-2 size-4" />
            Support
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MegaphoneIcon className="mr-2 size-4" />
          {"What's new"}
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          data-testid="sign-out"
          onSelect={(event) => {
            event.preventDefault();
            onSignOut();
          }}
          disabled={isSigningOut}
        >
          {isSigningOut && <Loader2 className="mr-2 size-4 animate-spin" />}
          Log out
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  );
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
        <DropdownMenuContent side="right" align="end" className="w-64">
          <ProfileHeader name={name} email={email} image={image} />
          <DropdownMenuSeparator />
          <ProfileMenuItems onSignOut={handleSignOut} isSigningOut={isSigningOut} />
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
            size="icon"
            variant="ghost"
            className="cursor-pointer"
            aria-label="Open user menu"
            data-testid="user-menu-trigger"
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-72">
          <ProfileHeader name={name} email={email} image={image} />
          <DropdownMenuSeparator />
          <ProfileMenuItems onSignOut={handleSignOut} isSigningOut={isSigningOut} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
