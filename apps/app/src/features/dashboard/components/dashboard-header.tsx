"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  BarChart3Icon,
  BellIcon,
  CalculatorIcon,
  CalendarIcon,
  Check,
  ClipboardPasteIcon,
  CodeIcon,
  CopyIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  FolderPlusIcon,
  HelpCircleIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  LayoutGridIcon,
  ListIcon,
  Loader2,
  MegaphoneIcon,
  PlusIcon,
  ScissorsIcon,
  Search,
  SettingsIcon,
  SunMoon,
  TrashIcon,
  UserIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSupabaseUser } from "@/features/auth/hooks/use-supabase-user";
import { signOutAction } from "@/features/auth/actions/sign-out";

interface DashboardHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function DashboardHeader({ title, actions }: DashboardHeaderProps) {
  const { user } = useSupabaseUser();
  const metadata = user?.user_metadata ?? {};
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : "";
  const fallbackAvatar = typeof metadata.picture === "string" ? metadata.picture : "";
  const displayImage = avatarUrl.length > 0 ? avatarUrl : fallbackAvatar;
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
  const fallbackName = typeof metadata.name === "string" ? metadata.name : "";
  const displayName = fullName || fallbackName || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email ?? "";
  const initials = displayName.charAt(0).toUpperCase();

  const [isSigningOut, startSignOut] = React.useTransition();

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

  return (
    <div className="flex h-[48px] w-full items-center justify-between border-b border-border px-[12px] py-[4px]">
      <div className="gap-2 flex items-center">
        <SidebarTrigger />
        <span className="text-sm">{title}</span>
      </div>
      <div className="gap-3 flex items-center">
        <HeaderCommand />
        {actions && <div className="gap-2 flex items-center">{actions}</div>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="cursor-pointer rounded-full">
              <Avatar>
                <AvatarImage src={displayImage} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="gap-3 px-3 py-2.5 flex items-center">
              <Avatar size="lg">
                <AvatarImage src={displayImage} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs truncate text-muted-foreground">{displayEmail}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
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
                onSelect={(e) => {
                  e.preventDefault();
                  handleSignOut();
                }}
                disabled={isSigningOut}
              >
                {isSigningOut && <Loader2 className="mr-2 size-4 animate-spin" />}
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
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

function HeaderCommand() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="h-8 gap-2 text-xs w-[180px] cursor-pointer justify-between text-muted-foreground"
      >
        <span className="gap-1.5 flex items-center">
          <Search className="size-3.5" />
          Search workspace
        </span>
        <kbd className="px-1 sm:inline-flex pointer-events-none hidden rounded-sm border border-border bg-muted font-mono text-[10px] select-none">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem>
                <HomeIcon />
                <span>Home</span>
                <CommandShortcut>⌘H</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <InboxIcon />
                <span>Inbox</span>
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <FileTextIcon />
                <span>Documents</span>
                <CommandShortcut>⌘D</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <FolderIcon />
                <span>Folders</span>
                <CommandShortcut>⌘F</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem>
                <PlusIcon />
                <span>New File</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <FolderPlusIcon />
                <span>New Folder</span>
                <CommandShortcut>⇧⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CopyIcon />
                <span>Copy</span>
                <CommandShortcut>⌘C</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <ScissorsIcon />
                <span>Cut</span>
                <CommandShortcut>⌘X</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <ClipboardPasteIcon />
                <span>Paste</span>
                <CommandShortcut>⌘V</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <TrashIcon />
                <span>Delete</span>
                <CommandShortcut>⌫</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="View">
              <CommandItem>
                <LayoutGridIcon />
                <span>Grid View</span>
              </CommandItem>
              <CommandItem>
                <ListIcon />
                <span>List View</span>
              </CommandItem>
              <CommandItem>
                <ZoomInIcon />
                <span>Zoom In</span>
                <CommandShortcut>⌘+</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <ZoomOutIcon />
                <span>Zoom Out</span>
                <CommandShortcut>⌘-</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem>
                <UserIcon />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCardIcon />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <SettingsIcon />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <BellIcon />
                <span>Notifications</span>
              </CommandItem>
              <CommandItem>
                <HelpCircleIcon />
                <span>Help &amp; Support</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Tools">
              <CommandItem>
                <CalculatorIcon />
                <span>Calculator</span>
              </CommandItem>
              <CommandItem>
                <CalendarIcon />
                <span>Calendar</span>
              </CommandItem>
              <CommandItem>
                <ImageIcon />
                <span>Image Editor</span>
              </CommandItem>
              <CommandItem>
                <CodeIcon />
                <span>Code Editor</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
