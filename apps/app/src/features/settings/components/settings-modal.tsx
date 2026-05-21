"use client";

import { useMemo, useState } from "react";
import {
  AppWindow,
  BarChart3,
  Megaphone,
  Receipt,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AppsSettingsShell } from "./settings-apps-shell";
import { BillingSettingsShell } from "./settings-billing-shell";
import { ChannelsSettingsShell } from "./settings-channels-shell";
import { GeneralSettingsShell } from "./settings-general-shell";
import { PricingSettingsShell } from "./settings-pricing-shell";
import { ProfileSettingsShell } from "./settings-profile-shell";
import { SecuritySettingsShell } from "./settings-security-shell";
import { UsageSettingsShell } from "./settings-usage-shell";
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
  { id: "apps", label: "Apps", icon: AppWindow },
  { id: "channels", label: "Channels", icon: Megaphone },
];

const ACCOUNT_ITEMS: NavItem[] = [{ id: "profile", label: "Profile", icon: User }];

const PAGE_CONTENT: Record<SettingsPage, React.ComponentType> = {
  general: GeneralSettingsShell,
  pricing: PricingSettingsShell,
  billing: BillingSettingsShell,
  usage: UsageSettingsShell,
  security: SecuritySettingsShell,
  apps: AppsSettingsShell,
  channels: ChannelsSettingsShell,
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

  const hasNoResults = filteredWorkspace.length === 0 && filteredAccount.length === 0;
  const PageContent = PAGE_CONTENT[activePage];

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
