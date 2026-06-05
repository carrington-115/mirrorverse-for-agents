"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  Loader2,
  Phone,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { WORKFLOW_KIND_LABEL, type WorkflowKind } from "@/features/chat/config";
import {
  readWorkflowCommitError,
  readWorkflowCommitResult,
  readWorkflowCommitStatus,
  type WorkflowCommitInput,
  type WorkflowCommitToolPart,
} from "@/features/chat/lib/workflow-commit-tool";
import { WorkflowDeployButton } from "@/features/workflows/components/workflow-deploy-button";

interface WorkflowCommitCardProps {
  part: WorkflowCommitToolPart;
  onWorkflowSelect?: (workflowId: string) => void;
}

const KIND_ICONS: Record<WorkflowKind, typeof Zap> = {
  automation: Zap,
  "voice-agent": Phone,
  "chat-agent": Bot,
  code: Code2,
};

const KIND_ICON_BG: Record<WorkflowKind, string> = {
  automation: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "voice-agent": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "chat-agent": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  code: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

const TRIGGER_LABELS: Record<string, string> = {
  webhook: "Webhook",
  cron: "Schedule",
  manual: "Manual",
  app_event: "App event",
  form: "Form submission",
  chat_message: "Chat message",
};

const BRAND_NAMES: Record<string, string> = {
  slack: "Slack",
  discord: "Discord",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  gmail: "Gmail",
  "google-calendar": "Google Calendar",
  "google-drive": "Google Drive",
  github: "GitHub",
  gitlab: "GitLab",
  notion: "Notion",
  stripe: "Stripe",
  hubspot: "HubSpot",
  salesforce: "Salesforce",
  calendly: "Calendly",
  twilio: "Twilio",
  jira: "Jira",
  asana: "Asana",
  airtable: "Airtable",
  zendesk: "Zendesk",
  shopify: "Shopify",
  intercom: "Intercom",
  linear: "Linear",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  redis: "Redis",
  supabase: "Supabase",
};

type RawDoc = { nodes?: unknown[]; connections?: unknown[] } | null;

function extractTriggerLabel(doc: RawDoc): string | null {
  const nodes = Array.isArray(doc?.nodes) ? doc.nodes : [];
  for (const node of nodes) {
    if (typeof node !== "object" || !node) continue;
    const n = node as Record<string, unknown>;
    const type = typeof n.type === "string" ? n.type : "";
    if (type.startsWith("trigger.")) {
      const tail = type.slice("trigger.".length);
      return (
        TRIGGER_LABELS[tail] ?? tail.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      );
    }
  }
  return null;
}

function extractAppNames(doc: RawDoc): string[] {
  const nodes = Array.isArray(doc?.nodes) ? doc.nodes : [];
  const seen = new Set<string>();
  for (const node of nodes) {
    if (typeof node !== "object" || !node) continue;
    const n = node as Record<string, unknown>;
    const hints = n.hints as
      | { channelKind?: string; mcpServerId?: string; modelId?: string }
      | undefined;
    if (hints?.channelKind) {
      const name = BRAND_NAMES[hints.channelKind];
      if (name) seen.add(name);
    }
    if (hints?.mcpServerId) {
      const lower = hints.mcpServerId.toLowerCase();
      for (const [slug, name] of Object.entries(BRAND_NAMES)) {
        if (lower.includes(slug)) {
          seen.add(name);
          break;
        }
      }
    }
    if (hints?.modelId) {
      const m = hints.modelId.toLowerCase();
      if (m.startsWith("claude")) seen.add("Anthropic");
      else if (
        m.startsWith("gpt-") ||
        m.startsWith("o1") ||
        m.startsWith("o3") ||
        m.startsWith("o4")
      )
        seen.add("OpenAI");
      else if (m.startsWith("gemini")) seen.add("Google");
    }
  }
  return [...seen];
}

export function WorkflowCommitCard({
  part,
  onWorkflowSelect: _onWorkflowSelect,
}: WorkflowCommitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = readWorkflowCommitResult(part);
  const status = readWorkflowCommitStatus(part);
  const error = readWorkflowCommitError(part);

  const isBuilding = status === "building";
  const isFailed = status === "failed";

  const doc = result?.document as RawDoc;
  const nodeCount = Array.isArray(doc?.nodes) ? doc.nodes.length : 0;
  const connectionCount = Array.isArray(doc?.connections) ? doc.connections.length : 0;
  const json = result?.document ? JSON.stringify(result.document, null, 2) : "";

  const canExpand = !!result?.document;

  const input = part.input as WorkflowCommitInput | undefined;
  const description = input?.summary ?? input?.intent ?? null;

  const trigger = doc ? extractTriggerLabel(doc) : null;
  const apps = doc ? extractAppNames(doc) : [];

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const KindIcon = result ? (KIND_ICONS[result.kind] ?? Zap) : Zap;
  const kindBg = result
    ? (KIND_ICON_BG[result.kind] ?? KIND_ICON_BG.automation)
    : KIND_ICON_BG.automation;

  return (
    <div className="space-y-2">
      {/* JSON collapsible */}
      <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
        <div className="gap-2 px-3 py-2.5 flex w-full items-center">
          <button
            onClick={() => canExpand && setExpanded((v) => !v)}
            disabled={!canExpand}
            className="gap-2 min-w-0 flex flex-1 items-center text-left disabled:cursor-default"
            aria-expanded={expanded}
          >
            {isBuilding ? (
              <Loader2 className="size-3.5 animate-spin shrink-0 text-muted-foreground" />
            ) : expanded ? (
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="text-xs font-medium text-muted-foreground">Workflow</span>
            {result ? (
              <span className="gap-1 ml-1 min-w-0 flex items-center">
                <span className="px-1.5 py-0.5 max-w-[120px] truncate rounded-sm bg-muted text-[10px] text-muted-foreground">
                  {result.title}
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] text-muted-foreground">
                  {WORKFLOW_KIND_LABEL[result.kind]}
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] text-muted-foreground">
                  {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
                </span>
                <span className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] text-muted-foreground">
                  {connectionCount} {connectionCount === 1 ? "connection" : "connections"}
                </span>
              </span>
            ) : isBuilding ? (
              <span className="text-[10px] text-muted-foreground">Building…</span>
            ) : null}
          </button>

          {result && (
            <div
              className="ml-auto flex shrink-0 items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-[11px] text-muted-foreground"
                onClick={handleCopy}
                disabled={!json}
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}
        </div>

        {isFailed && error && (
          <div className="px-3 py-2 text-xs border-t border-destructive/20 bg-destructive/5 text-destructive">
            {error}
          </div>
        )}

        {expanded && json && (
          <div className="max-h-[480px] overflow-auto border-t border-border">
            <pre className="p-3 leading-relaxed font-mono text-[11px] whitespace-pre text-foreground/80">
              {json}
            </pre>
          </div>
        )}
      </div>

      {/* Workflow summary card */}
      {result && (
        <div className="px-4 py-3.5 rounded-xl border border-border bg-card">
          <div className="gap-3 flex items-start">
            <div className={`size-10 grid shrink-0 place-items-center rounded-lg ${kindBg}`}>
              <KindIcon className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm leading-snug">{result.title}</div>
              {description && (
                <p className="mt-0.5 text-xs leading-relaxed line-clamp-2 text-muted-foreground">
                  {description}
                </p>
              )}

              {(trigger || apps.length > 0) && (
                <div className="mt-2 gap-x-4 gap-y-1 flex flex-wrap text-[11px] text-muted-foreground">
                  {trigger && (
                    <span>
                      <span className="font-medium text-foreground/70">Trigger:</span> {trigger}
                    </span>
                  )}
                  {apps.length > 0 && (
                    <span>
                      <span className="font-medium text-foreground/70">Apps:</span>{" "}
                      {apps.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="gap-1.5 flex shrink-0 items-center">
              <WorkflowDeployButton workflowId={result.workflowId} size="sm" />
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs font-medium"
              >
                <Link href={`/workflows/${result.workflowId}`}>
                  <ExternalLink className="size-3.5" />
                  Open
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
