"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3Icon,
  BookOpen,
  Check,
  CreditCardIcon,
  HelpCircleIcon,
  Loader2,
  LogOutIcon,
  MegaphoneIcon,
  MessageCirclePlus,
  MonitorIcon,
  MoonIcon,
  PhoneIcon,
  PlugIcon,
  PlusIcon,
  Search,
  SettingsIcon,
  Shapes,
  ShieldIcon,
  Sparkles,
  SunIcon,
  SunMoon,
  UploadIcon,
  UserIcon,
  WorkflowIcon,
  ZapIcon,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseUser } from "@/features/auth/hooks/use-supabase-user";
import { signOutAction } from "@/features/auth/actions/sign-out";
import { useCurrentPlanQuery, useUsagePeriodQuery } from "@/features/billing/api/queries";
import { useSettingsModal } from "@/features/settings/hooks/use-settings-modal";
import type { SettingsPage } from "@/features/settings/hooks/use-settings-modal";

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

  const { data: planData, isLoading: planLoading } = useCurrentPlanQuery();
  const { data: usageData, isLoading: usageLoading } = useUsagePeriodQuery();

  const planName = planData?.plan?.name ?? "Free";
  const planId = planData?.plan?.id ?? "free";
  const creditsLimit = planData?.plan?.limits?.includedCredits ?? 0;
  const creditsUsed = (usageData?.usage ?? []).reduce((sum, u) => sum + u.totalCredits, 0);
  const creditsPct = creditsLimit > 0 ? Math.min(creditsUsed / creditsLimit, 1) : 0;

  const [isSigningOut, startSignOut] = React.useTransition();
  const { openSettings } = useSettingsModal();

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
    <div className="h-12 px-3 py-1 flex w-full shrink-0 items-center justify-between border-b border-border">
      <div className="gap-2 flex items-center">
        <SidebarTrigger />
        <span className="text-sm">{title}</span>
      </div>
      <div className="gap-3 flex items-center">
        <HeaderCommand />
        {actions && <div className="gap-2 flex items-center">{actions}</div>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="User menu"
              suppressHydrationWarning
            >
              <ProfileAvatarWithRing src={displayImage} fallback={initials} pct={creditsPct} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
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
            <div className="px-2 pb-2">
              <BillingCard
                onOpenSettings={openSettings}
                planName={planName}
                planId={planId}
                creditsUsed={creditsUsed}
                creditsLimit={creditsLimit}
                isLoading={planLoading || usageLoading}
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => openSettings("profile")}>
                <UserIcon className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openSettings("billing")}>
                <CreditCardIcon className="mr-2 size-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openSettings("usage")}>
                <BarChart3Icon className="mr-2 size-4" />
                Usage
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <AppearanceSubmenu />
              <DropdownMenuItem onSelect={() => openSettings("general")}>
                <SettingsIcon className="mr-2 size-4" />
                Settings
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

const RING_R = 15;
const RING_CIRC = 2 * Math.PI * RING_R;

function CreditsRing({ pct }: { pct: number }) {
  return (
    <svg
      viewBox="0 0 36 36"
      className="inset-0 pointer-events-none absolute h-full w-full -rotate-90"
      aria-hidden
    >
      <circle
        cx="18"
        cy="18"
        r={RING_R}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-muted-foreground/20"
      />
      <circle
        cx="18"
        cy="18"
        r={RING_R}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={RING_CIRC}
        strokeDashoffset={RING_CIRC * (1 - pct)}
        className="text-primary transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

function ProfileAvatarWithRing({
  src,
  fallback,
  pct,
}: {
  src: string;
  fallback: string;
  pct: number;
}) {
  return (
    <div className="size-9 relative flex shrink-0 items-center justify-center">
      <Avatar className="size-[26px]">
        <AvatarImage src={src} />
        <AvatarFallback className="text-[10px]">{fallback}</AvatarFallback>
      </Avatar>
      <CreditsRing pct={pct} />
    </div>
  );
}

interface BillingCardProps {
  onOpenSettings: (page: SettingsPage) => void;
  planName: string;
  planId: string;
  creditsUsed: number;
  creditsLimit: number;
  isLoading: boolean;
}

function BillingCard({
  onOpenSettings,
  planName,
  planId,
  creditsUsed,
  creditsLimit,
  isLoading,
}: BillingCardProps) {
  const isUpgradeable = planId !== "pro" && planId !== "custom";
  const creditsPct = creditsLimit > 0 ? Math.min(creditsUsed / creditsLimit, 1) : 0;
  const fmtCredits = (n: number) => n.toLocaleString();

  return (
    <div className="p-3 space-y-2.5 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="gap-1.5 flex items-center">
          {isLoading ? (
            <Skeleton className="h-3.5 w-20" />
          ) : (
            <>
              <span className="text-xs font-semibold text-foreground">{planName} Plan</span>
              <span className="px-1.5 font-medium inline-flex items-center rounded-full bg-primary/10 py-px text-[10px] text-primary">
                Current
              </span>
            </>
          )}
        </div>
        {!isLoading && isUpgradeable && (
          <button
            onClick={() => onOpenSettings("pricing")}
            className="h-5 gap-1 px-1.5 font-medium inline-flex cursor-pointer items-center rounded-sm border border-primary/30 bg-primary/10 text-[10px] text-primary transition-colors hover:bg-primary/20"
          >
            <ZapIcon className="size-2.5" />
            Upgrade
          </button>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Credits</span>
          {isLoading ? (
            <Skeleton className="h-3 w-20" />
          ) : (
            <span className="font-medium text-[11px]">
              {fmtCredits(creditsUsed)} / {fmtCredits(creditsLimit)} credits
            </span>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-full" />
          ) : (
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700"
              style={{ width: `${creditsPct * 100}%` }}
            />
          )}
        </div>
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
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { openSettings } = useSettingsModal();
  const [isPending, startTransition] = React.useTransition();

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

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const handleNewChat = () => {
    setOpen(false);
    if (pathname === "/mirrorpilot") {
      window.location.href = "/mirrorpilot";
    } else {
      router.push("/mirrorpilot");
    }
  };

  const handleSignOut = () => {
    setOpen(false);
    startTransition(async () => {
      try {
        await signOutAction();
      } catch (error) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
        toast.error(error instanceof Error ? error.message : "Failed to sign out");
      }
    });
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="ghost"
        size="icon-sm"
        className="md:hidden cursor-pointer text-muted-foreground"
        aria-label="Search workspace"
      >
        <Search className="size-4" />
      </Button>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="h-8 gap-2 text-xs md:flex hidden w-[180px] cursor-pointer justify-between text-muted-foreground"
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
              <CommandItem onSelect={() => runCommand(() => router.push("/mirrorpilot"))}>
                <Sparkles />
                <span>Mirrorpilot</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/workflows"))}>
                <WorkflowIcon />
                <span>Workflows</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/knowledge"))}>
                <BookOpen />
                <span>Knowledge</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/integrations"))}>
                <Shapes />
                <span>Integrations</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/deploy/phone"))}>
                <PhoneIcon />
                <span>Phone agents</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Create">
              <CommandItem onSelect={handleNewChat}>
                <MessageCirclePlus />
                <span>New chat</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/workflows"))}>
                <PlusIcon />
                <span>New workflow</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/knowledge"))}>
                <UploadIcon />
                <span>Upload to knowledge base</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/integrations"))}>
                <PlugIcon />
                <span>Connect an integration</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Account & Settings">
              <CommandItem onSelect={() => runCommand(() => openSettings("profile"))}>
                <UserIcon />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => openSettings("billing"))}>
                <CreditCardIcon />
                <span>Billing</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => openSettings("usage"))}>
                <BarChart3Icon />
                <span>Usage</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => openSettings("security"))}>
                <ShieldIcon />
                <span>Security</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => openSettings("channels"))}>
                <MegaphoneIcon />
                <span>Channels</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => openSettings("pricing"))}>
                <ZapIcon />
                <span>Upgrade plan</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => openSettings("general"))}>
                <SettingsIcon />
                <span>Settings</span>
                <CommandShortcut>⌘,</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Appearance">
              <CommandItem
                data-checked={theme === "light" ? "true" : "false"}
                onSelect={() => runCommand(() => setTheme("light"))}
              >
                <SunIcon />
                <span>Light</span>
              </CommandItem>
              <CommandItem
                data-checked={theme === "dark" ? "true" : "false"}
                onSelect={() => runCommand(() => setTheme("dark"))}
              >
                <MoonIcon />
                <span>Dark</span>
              </CommandItem>
              <CommandItem
                data-checked={theme === "system" ? "true" : "false"}
                onSelect={() => runCommand(() => setTheme("system"))}
              >
                <MonitorIcon />
                <span>System</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Help">
              <CommandItem
                onSelect={() =>
                  runCommand(() => {
                    window.location.href = "mailto:support@mirrorverse.ai";
                  })
                }
              >
                <HelpCircleIcon />
                <span>Contact support</span>
              </CommandItem>
              <CommandItem
                onSelect={handleSignOut}
                disabled={isPending}
                className="text-destructive data-selected:text-destructive"
              >
                {isPending ? <Loader2 className="animate-spin" /> : <LogOutIcon />}
                <span>Log out</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
