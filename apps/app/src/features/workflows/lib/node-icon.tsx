"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

const ICONIFY_BASE = "https://api.iconify.design";

export type NodeIconTone =
  | "trigger"
  | "core"
  | "ai"
  | "flow"
  | "transform"
  | "human"
  | "skill"
  | "editor"
  | "muted";

const TONE_BG: Record<NodeIconTone, string> = {
  trigger: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  core: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  ai: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  flow: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  transform: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  human: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  skill: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  editor: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
  muted: "bg-muted text-muted-foreground",
};

// Map keys for `core.*` and `trigger.*` kinds are stored without their
// namespace prefix because those two prefixes don't add visual disambiguation
// at the leaf (a "webhook" or "cron" is the same icon either way). Other
// namespaces (ai.*, flow.*, human.*, skill.*, editor.*) keep their dotted
// form for clarity since their leaves can be ambiguous. Lookup tries the full
// key first, then falls back to the tail after the first dot.
const KIND_ICON: Record<string, string> = {
  manual: "lucide:mouse-pointer-click",
  cron: "lucide:clock",
  webhook: "lucide:webhook",
  app_event: "lucide:zap",
  inbound_call: "lucide:phone-incoming",
  tool_call: "lucide:wrench",
  http_request: "lucide:globe",
  code: "lucide:code-2",
  respond_to_webhook: "lucide:reply",
  "ai.agent": "lucide:bot",
  "ai.language_model": "lucide:brain-circuit",
  "ai.memory": "lucide:database",
  "ai.output_parser": "lucide:file-json",
  "ai.retriever": "lucide:search",
  "flow.if": "lucide:git-branch",
  "flow.switch": "lucide:signpost",
  "flow.loop": "lucide:repeat",
  "flow.merge": "lucide:git-merge",
  "flow.filter": "lucide:filter",
  "flow.wait": "lucide:hourglass",
  "flow.stop": "lucide:octagon",
  "flow.noop": "lucide:minus",
  transform: "lucide:arrow-left-right",
  "human.review": "lucide:user-check",
  "skill.call": "lucide:sparkles",
  "editor.sticky_note": "lucide:sticky-note",
};

function lookupKindIcon(kind: string): string {
  const exact = KIND_ICON[kind];
  if (exact) return exact;
  const dot = kind.indexOf(".");
  if (dot >= 0) {
    const tail = kind.slice(dot + 1);
    const tailMatch = KIND_ICON[tail];
    if (tailMatch) return tailMatch;
  }
  return "lucide:circle";
}

function kindTone(kind: string): NodeIconTone {
  const prefix = kind.split(".")[0];
  switch (prefix) {
    case "trigger":
      return "trigger";
    case "core":
      return "core";
    case "ai":
      return "ai";
    case "flow":
      return "flow";
    case "transform":
      return "transform";
    case "human":
      return "human";
    case "skill":
      return "skill";
    case "editor":
      return "editor";
    default:
      return "muted";
  }
}

const BRAND_ICONIFY_ID: Record<string, string> = {
  slack: "logos:slack-icon",
  discord: "logos:discord-icon",
  telegram: "logos:telegram",
  postgres: "logos:postgresql",
  mysql: "logos:mysql-icon",
  mongodb: "logos:mongodb-icon",
  redis: "logos:redis",
  supabase: "logos:supabase-icon",
  anthropic: "logos:anthropic-icon",
  openai: "logos:openai-icon",
  google: "logos:google-icon",
  gmail: "logos:google-gmail",
  "google-calendar": "logos:google-calendar",
  "google-drive": "logos:google-drive",
  github: "logos:github-icon",
  gitlab: "logos:gitlab",
  linear: "logos:linear-icon",
  notion: "logos:notion-icon",
  stripe: "logos:stripe",
  hubspot: "logos:hubspot",
  salesforce: "logos:salesforce",
  calendly: "logos:calendly",
  twilio: "logos:twilio-icon",
  vercel: "logos:vercel-icon",
  microsoft: "logos:microsoft-icon",
  jira: "logos:jira",
  asana: "logos:asana-icon",
  airtable: "logos:airtable",
  zendesk: "logos:zendesk-icon",
  shopify: "logos:shopify",
  intercom: "logos:intercom-icon",
  segment: "logos:segment-icon",
  posthog: "logos:posthog-icon",
  sentry: "logos:sentry-icon",
  inngest: "logos:inngest-icon",
};

export interface NodeIconHints {
  readonly mcpServerId?: string | null;
  readonly modelId?: string | null;
}

type RawNode = Record<string, unknown>;

function readString(obj: RawNode, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function extractIconHints(node: RawNode): NodeIconHints | undefined {
  // Support both new schema (fields in params) and direct fields for backwards compat.
  const params =
    typeof node.params === "object" && node.params !== null ? (node.params as RawNode) : node;

  const out: { mcpServerId?: string; modelId?: string } = {};

  const mcpServerId = readString(params, "mcpServerId") ?? readString(node, "mcpServerId");
  if (mcpServerId) out.mcpServerId = mcpServerId;

  const modelId =
    readString(params, "model") ??
    readString(node, "model") ??
    readString(params, "modelId") ??
    readString(node, "modelId");
  if (modelId) out.modelId = modelId;

  // Voice agents carry model info inside modelConnection.model
  if (!out.modelId) {
    const mc = (params.modelConnection ?? node.modelConnection) as RawNode | undefined;
    if (mc && typeof mc === "object") {
      const m = readString(mc, "model");
      if (m) out.modelId = m;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function brandFromModel(modelId: string): string | null {
  const m = modelId.toLowerCase();
  if (m.startsWith("claude")) return "anthropic";
  if (m.startsWith("gpt-") || m.startsWith("o1") || m.startsWith("o3") || m.startsWith("o4")) {
    return "openai";
  }
  if (m.startsWith("gemini")) return "google";
  return null;
}

function brandFromMcpServer(mcpServerId: string): string | null {
  const lowered = mcpServerId.toLowerCase();
  for (const slug of Object.keys(BRAND_ICONIFY_ID)) {
    if (lowered.includes(slug)) return slug;
  }
  return null;
}

export function resolveBrandIconId(hints: NodeIconHints | undefined): string | null {
  if (!hints) return null;
  if (hints.modelId) {
    const slug = brandFromModel(hints.modelId);
    if (slug && BRAND_ICONIFY_ID[slug]) return BRAND_ICONIFY_ID[slug];
  }
  if (hints.mcpServerId) {
    const slug = brandFromMcpServer(hints.mcpServerId);
    if (slug && BRAND_ICONIFY_ID[slug]) return BRAND_ICONIFY_ID[slug];
  }
  return null;
}

interface NodeIconProps {
  readonly kind: string;
  readonly hints?: NodeIconHints;
  readonly size?: number;
  readonly className?: string;
}

export function NodeIcon({ kind, hints, size = 18, className }: NodeIconProps) {
  const brandId = resolveBrandIconId(hints);
  const kindId = lookupKindIcon(kind);

  if (brandId) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-md border border-border bg-background",
          className,
        )}
        style={{ width: size + 10, height: size + 10 }}
      >
        <Image
          src={`${ICONIFY_BASE}/${brandId}.svg`}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  const tone = kindTone(kind);
  const url = `${ICONIFY_BASE}/${kindId}.svg`;

  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-md", TONE_BG[tone], className)}
      style={{ width: size + 10, height: size + 10 }}
      aria-hidden
    >
      <span
        style={{
          display: "block",
          width: size,
          height: size,
          backgroundColor: "currentColor",
          WebkitMaskImage: `url(${url})`,
          maskImage: `url(${url})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    </span>
  );
}
