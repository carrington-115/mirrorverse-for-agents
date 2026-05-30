"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import type { ComponentType } from "react";
import { Clock, FileText, MessageSquare, Phone, Play, Webhook, Zap } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

// ─── Main component ───────────────────────────────────────────────────────────

interface TriggerPickerButtonProps {
  triggerCount: number;
}

export function TriggerPickerButton({ triggerCount }: TriggerPickerButtonProps) {
  const controller = usePromptInputController();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const allTriggers = useTriggerItems();

  const handleSelect = useCallback(
    (trigger: TriggerItem) => {
      controller.textInput.setInput(`Set up a ${trigger.label} trigger`);
      setOpen(false);
    },
    [controller],
  );

  return (
    <>
      <div className="relative">
        <PromptInputButton
          onClick={() => setOpen(true)}
          tooltip="Add trigger"
          className="rounded-full"
        >
          <Zap className="size-4" />
        </PromptInputButton>
        {triggerCount > 0 && (
          <span className="-right-1 -top-1 size-4 font-bold pointer-events-none absolute flex items-center justify-center rounded-full bg-primary text-[9px] leading-none text-primary-foreground">
            {triggerCount > 9 ? "9+" : triggerCount}
          </span>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
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
