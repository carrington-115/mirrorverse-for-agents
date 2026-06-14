"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  History,
  KeyRound,
  Megaphone,
  Receipt,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@mirrorverse/ui/hooks/use-mobile";
import { EnvVarsSettingsShell } from "./settings-env-vars-shell";
import { BillingSettingsShell } from "./settings-billing-shell";
import { ChannelsSettingsShell } from "./settings-channels-shell";
import { GeneralSettingsShell } from "./settings-general-shell";
import { PricingSettingsShell } from "./settings-pricing-shell";
import { ProfileSettingsShell } from "./settings-profile-shell";
import { SecuritySettingsShell } from "./settings-security-shell";
import { UsageSettingsShell } from "./settings-usage-shell";
import { RunsSettingsShell } from "./settings-runs-shell";
import { WorkflowsSettingsShell } from "./settings-workflows-shell";
import { type SettingsPage, useSettingsModal } from "../hooks/use-settings-modal";

type NavItem = {
  id: SettingsPage;
  label: string;
  icon: React.ElementType;
};

const WORKSPACE_ITEMS: NavItem[] = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "pricing", label: "Pricing", icon: Zap },
  { id: "billing", label: "Billing", icon: Receipt },
  { id: "usage", label: "Usage", icon: BarChart3 },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "environment", label: "Environment", icon: KeyRound },
  { id: "channels", label: "Channels", icon: Megaphone },
  { id: "runs", label: "Run History", icon: History },
  { id: "workflows", label: "Workflows", icon: Workflow },
];

const ACCOUNT_ITEMS: NavItem[] = [{ id: "profile", label: "Profile", icon: User }];

const ALL_ITEMS: NavItem[] = [...WORKSPACE_ITEMS, ...ACCOUNT_ITEMS];

const PAGE_CONTENT: Record<SettingsPage, React.ComponentType> = {
  general: GeneralSettingsShell,
  pricing: PricingSettingsShell,
  billing: BillingSettingsShell,
  usage: UsageSettingsShell,
  security: SecuritySettingsShell,
  environment: EnvVarsSettingsShell,
  channels: ChannelsSettingsShell,
  runs: RunsSettingsShell,
  workflows: WorkflowsSettingsShell,
  profile: ProfileSettingsShell,
};

function NavButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "gap-2 px-3 py-2 text-sm flex w-full cursor-pointer items-center rounded-md text-left transition-colors",
        isActive
          ? "font-medium bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </button>
  );
}

export function SettingsModal() {
  const { isOpen, activePage, closeSettings, navigateTo } = useSettingsModal();
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();

  const filteredWorkspace = useMemo(
    () =>
      search.trim()
        ? WORKSPACE_ITEMS.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
        : WORKSPACE_ITEMS,
    [search],
  );

  const filteredAccount = useMemo(
    () =>
      search.trim()
        ? ACCOUNT_ITEMS.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
        : ACCOUNT_ITEMS,
    [search],
  );

  const filteredAll = useMemo(
    () =>
      search.trim()
        ? ALL_ITEMS.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
        : ALL_ITEMS,
    [search],
  );

  const hasNoResults = filteredWorkspace.length === 0 && filteredAccount.length === 0;
  const PageContent = PAGE_CONTENT[activePage];

  if (isMobile) {
    return (
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeSettings();
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="p-0 gap-0 rounded-none border-0"
        >
          <SheetTitle className="sr-only">Settings</SheetTitle>

          {/* Inner container forces full-screen height inside the bottom sheet */}
          <div className="flex h-dvh flex-col">
            {/* Sticky header */}
            <div className="shrink-0 border-b border-border bg-background">
              {/* Title + close button */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <span className="text-base font-semibold">Settings</span>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon-sm">
                    <X className="size-4" />
                  </Button>
                </SheetClose>
              </div>

              {/* Search bar */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="left-2.5 size-3.5 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search settings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>

              {/* Badge navigation */}
              <div className="gap-2 px-4 pb-3 flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {filteredAll.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium shrink-0 rounded-full whitespace-nowrap transition-colors",
                      activePage === item.id
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
                {hasNoResults && (
                  <p className="py-1 text-xs text-muted-foreground">
                    No results for &ldquo;{search}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="p-4 flex-1 overflow-y-auto">
              <PageContent />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: existing sidebar Dialog
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeSettings();
      }}
    >
      <DialogContent className="max-w-5xl! p-0 gap-0 max-h-[95vh]! w-[82vw]! overflow-hidden">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-[700px] max-h-[95vh]">
          {/* Sidebar */}
          <div className="w-52 flex shrink-0 flex-col border-r border-border">
            <div className="px-3 py-3 border-b border-border">
              <div className="relative">
                <Search className="left-2.5 size-3.5 pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search settings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-0.5 p-2 flex-1 overflow-y-auto">
              <p className="px-3 py-1.5 font-medium tracking-wide text-[11px] text-muted-foreground uppercase">
                Workspace
              </p>
              {filteredWorkspace.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  isActive={activePage === item.id}
                  onClick={() => navigateTo(item.id)}
                />
              ))}

              {filteredAccount.length > 0 && (
                <>
                  <div className="px-3 py-2">
                    <div className="border-t border-border" />
                  </div>
                  <p className="px-3 py-1.5 font-medium tracking-wide text-[11px] text-muted-foreground uppercase">
                    Account
                  </p>
                  {filteredAccount.map((item) => (
                    <NavButton
                      key={item.id}
                      item={item}
                      isActive={activePage === item.id}
                      onClick={() => navigateTo(item.id)}
                    />
                  ))}
                </>
              )}

              {hasNoResults && (
                <p className="px-3 py-6 text-xs text-center text-muted-foreground">
                  No results for &ldquo;{search}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Content pane */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="p-6">
              <PageContent />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
