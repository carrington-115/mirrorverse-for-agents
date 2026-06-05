"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import type { ComponentType } from "react";
import { Clock, FileText, MessageSquare, Phone, Play, Plus, Webhook, Zap } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PromptInputButton,
  usePromptInputController,
} from "@mirrorverse/ui/ai-elements/prompt-input";
import {
  useComposioIntegrationsQuery,
  useConnectionsQuery,
} from "@/features/integrations/api/queries";

// ─── Session trigger info ─────────────────────────────────────────────────────

export interface SessionTriggerInfo {
  type: string;
  workflowTitle: string;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SystemTrigger {
  kind: "system";
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

interface AppTrigger {
  kind: "app";
  id: string;
  label: string;
  triggerCount: number;
  logoUrl: string | null;
}

type TriggerItem = SystemTrigger | AppTrigger;

// ─── Built-in trigger definitions ────────────────────────────────────────────

const SYSTEM_TRIGGERS: SystemTrigger[] = [
  {
    kind: "system",
    id: "webhook",
    label: "Webhook",
    description: "Trigger when an HTTP request is received",
    icon: Webhook,
  },
  {
    kind: "system",
    id: "schedule",
    label: "Schedule",
    description: "Run on a cron schedule or fixed interval",
    icon: Clock,
  },
  {
    kind: "system",
    id: "manual",
    label: "Manual",
    description: "Run the workflow manually on demand",
    icon: Play,
  },
  {
    kind: "system",
    id: "chat_message",
    label: "Chat message",
    description: "Trigger when a message arrives in a chat channel",
    icon: MessageSquare,
  },
  {
    kind: "system",
    id: "form",
    label: "Form submission",
    description: "Trigger when a user submits a form",
    icon: FileText,
  },
  {
    kind: "system",
    id: "phone",
    label: "Phone call",
    description: "Trigger when an inbound phone call is received",
    icon: Phone,
  },
];

// ─── Hook — one card per connected app + system triggers ──────────────────────

const EXCLUDED_APP_SLUGS = new Set(["linkedin", "clickup"]);

function useTriggerItems(): TriggerItem[] {
  const { data: connections } = useConnectionsQuery();
  const { data: integrations } = useComposioIntegrationsQuery();

  return useMemo<TriggerItem[]>(() => {
    const appItems: AppTrigger[] = [];

    if (connections?.length && integrations?.length) {
      const bySlug = new Map(integrations.map((i) => [i.slug, i]));
      const seenApps = new Set<string>();

      for (const conn of connections) {
        if (conn.status !== "active") continue;
        if (seenApps.has(conn.appSlug)) continue;
        if (EXCLUDED_APP_SLUGS.has(conn.appSlug)) continue;
        seenApps.add(conn.appSlug);

        const integration = bySlug.get(conn.appSlug);
        if (!integration) continue;

        appItems.push({
          kind: "app",
          id: conn.appSlug,
          label: integration.name,
          triggerCount: integration.triggers?.length ?? 0,
          logoUrl: integration.logoUrl,
        });
      }
    }

    return [...SYSTEM_TRIGGERS, ...appItems];
  }, [connections, integrations]);
}

// ─── Type → system trigger lookup ────────────────────────────────────────────

function getTriggerTypeInfo(type: string): SystemTrigger | undefined {
  const id = type.startsWith("trigger.") ? type.slice("trigger.".length) : type;
  return SYSTEM_TRIGGERS.find((t) => t.id === id);
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TriggerPickerButtonProps {
  triggers?: SessionTriggerInfo[];
  externalDialogOpen?: boolean;
  onExternalDialogOpenChange?: (open: boolean) => void;
}

export function TriggerPickerButton({
  triggers = [],
  externalDialogOpen,
  onExternalDialogOpenChange,
}: TriggerPickerButtonProps) {
  const controller = usePromptInputController();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const isMobile = useIsMobile();
  const allTriggers = useTriggerItems();
  const triggerCount = triggers.length;

  const effectiveDialogOpen = dialogOpen || (externalDialogOpen ?? false);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) onExternalDialogOpenChange?.(false);
    },
    [onExternalDialogOpenChange],
  );

  const handleSelect = useCallback(
    (trigger: TriggerItem) => {
      controller.textInput.setInput(`Set up a ${trigger.label} trigger`);
      setDialogOpen(false);
      onExternalDialogOpenChange?.(false);
    },
    [controller, onExternalDialogOpenChange],
  );

  const handleCreateTrigger = () => {
    setPopoverOpen(false);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="relative">
        {triggerCount > 0 ? (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <PromptInputButton tooltip="View triggers" className="rounded-full">
                <Zap className="size-4" />
              </PromptInputButton>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-64 p-1">
              <div>
                {triggers.map((t, i) => {
                  const info = getTriggerTypeInfo(t.type);
                  const Icon = info?.icon ?? Zap;
                  return (
                    <div key={i} className="gap-3 px-3 py-2 flex items-center rounded-md">
                      <div className="size-7 flex shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="size-3.5 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug truncate">
                          {info?.label ?? t.type}
                        </p>
                        <p className="text-xs truncate text-muted-foreground">{t.workflowTitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 pt-1 border-t border-border">
                <button
                  type="button"
                  onClick={handleCreateTrigger}
                  className="gap-2 px-3 py-2 text-sm flex w-full items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Plus className="size-4 shrink-0" />
                  Create trigger
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <PromptInputButton
            onClick={() => setDialogOpen(true)}
            tooltip="Add trigger"
            className="rounded-full"
          >
            <Zap className="size-4" />
          </PromptInputButton>
        )}
        {triggerCount > 0 && (
          <span className="-right-1 -top-1 size-4 font-bold pointer-events-none absolute flex items-center justify-center rounded-full bg-primary text-[9px] leading-none text-primary-foreground">
            {triggerCount > 9 ? "9+" : triggerCount}
          </span>
        )}
      </div>

      <Dialog open={effectiveDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          className={cn(
            "max-h-[80vh] overflow-y-auto",
            isMobile ? "max-w-[95vw]" : "!max-w-[50vw]",
          )}
        >
          <DialogHeader>
            <DialogTitle>Choose a trigger</DialogTitle>
          </DialogHeader>
          <div className={cn("gap-3 grid", isMobile ? "grid-cols-1" : "grid-cols-4")}>
            {allTriggers.map((t) => (
              <TriggerCard key={t.id} trigger={t} onSelect={() => handleSelect(t)} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Trigger card ─────────────────────────────────────────────────────────────

function TriggerCard({ trigger, onSelect }: { trigger: TriggerItem; onSelect: () => void }) {
  const subtext =
    trigger.kind === "system"
      ? trigger.description
      : `${trigger.triggerCount} trigger${trigger.triggerCount !== 1 ? "s" : ""}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="gap-2.5 p-4 flex flex-col rounded-xl border border-border bg-card text-left transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="size-9 flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {trigger.kind === "system" ? (
          <trigger.icon className="size-4 text-foreground" />
        ) : (
          <AppLogo logoUrl={trigger.logoUrl} name={trigger.label} />
        )}
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-snug">{trigger.label}</p>
        <p className="text-xs leading-relaxed line-clamp-2 text-muted-foreground">{subtext}</p>
      </div>
    </button>
  );
}

// ─── App logo with error fallback ─────────────────────────────────────────────

function AppLogo({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  const [errored, setErrored] = useState(false);

  if (!logoUrl || errored) {
    return <Zap className="size-4 text-foreground" />;
  }

  return (
    <Image
      src={logoUrl}
      alt={name}
      width={24}
      height={24}
      unoptimized
      className="size-6 object-contain"
      onError={() => setErrored(true)}
    />
  );
}
