"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  Globe,
  GitBranch,
  Hammer,
  Pencil,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { PALETTE_ENTRIES, type PaletteCategory } from "@mirrorverse/agent/schemas";

import { Input } from "@/components/ui/input";
import { NodeIcon } from "@/features/workflows/lib/node-icon";
import { useMcpDirectoryListQuery } from "@/features/workflows/api/queries";
import { cn } from "@/lib/utils";

export interface PaletteAddOverrides {
  readonly name?: string;
  readonly mcpDirectorySlug?: string;
}

interface WorkflowPaletteProps {
  onAdd: (kind: string, overrides?: PaletteAddOverrides) => void;
  disabled?: boolean;
}

// Root-level buckets shown when the user opens the picker. Each maps to one or
// more PaletteCategory values from the agent schema; "apps" is a special
// bucket for MCP/integration vendors and will be populated from the workspace's
// MCP server list once we add the listing query.
type RootBucket = "ai" | "apps" | "transform" | "flow" | "core" | "human";

interface BucketMeta {
  readonly id: RootBucket;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly categories: readonly PaletteCategory[];
}

const BUCKETS: readonly BucketMeta[] = [
  {
    id: "ai",
    label: "AI",
    description: "Build autonomous agents, summarize or search documents",
    icon: Bot,
    categories: ["AI"],
  },
  {
    id: "apps",
    label: "Action in an app",
    description: "Do something in an app like Slack, Notion, or Postgres",
    icon: Globe,
    categories: [],
  },
  {
    id: "transform",
    label: "Data transformation",
    description: "Manipulate, filter, or convert data",
    icon: Pencil,
    categories: ["Transform"],
  },
  {
    id: "flow",
    label: "Flow",
    description: "Branch, merge, loop, or wait",
    icon: GitBranch,
    categories: ["Flow"],
  },
  {
    id: "core",
    label: "Core",
    description: "Run code, make HTTP requests, call tools",
    icon: Hammer,
    categories: ["Core"],
  },
  {
    id: "human",
    label: "Human review",
    description: "Request approval before sensitive steps",
    icon: ShieldCheck,
    categories: [],
  },
];

type View = "root" | RootBucket;

function entriesForBucket(bucket: BucketMeta) {
  if (bucket.categories.length === 0) return [];
  return PALETTE_ENTRIES.filter((e) => bucket.categories.includes(e.category));
}

function matchesSearch(
  haystack: { label: string; description: string; kind?: string },
  term: string,
): boolean {
  if (!term) return true;
  const t = term.toLowerCase();
  return (
    haystack.label.toLowerCase().includes(t) ||
    haystack.description.toLowerCase().includes(t) ||
    (haystack.kind?.toLowerCase().includes(t) ?? false)
  );
}

export function WorkflowPalette({ onAdd, disabled }: WorkflowPaletteProps) {
  const [view, setView] = useState<View>("root");
  const [search, setSearch] = useState("");

  const goRoot = () => {
    setView("root");
    setSearch("");
  };
  const goBucket = (bucket: RootBucket) => {
    setView(bucket);
    setSearch("");
  };

  const triggerEntries = useMemo(
    () => PALETTE_ENTRIES.filter((e) => e.category === "Triggers"),
    [],
  );

  if (view === "root") {
    const term = search.trim();
    const visibleBuckets = BUCKETS.filter((b) => matchesSearch(b, term));
    const visibleTriggers = triggerEntries.filter((e) => matchesSearch(e, term));

    return (
      <PaletteShell>
        <PaletteHeader title="What happens next?" />
        <PaletteSearch value={search} onChange={setSearch} />
        <div className="min-h-0 py-2 scrollbar-subtle flex-1 overflow-y-auto">
          {visibleBuckets.length === 0 && visibleTriggers.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">No matches.</p>
          ) : null}
          {visibleBuckets.map((b) => (
            <BucketRow key={b.id} bucket={b} onClick={() => goBucket(b.id)} />
          ))}
          {visibleTriggers.length > 0 ? (
            <>
              <div className="my-2 border-t border-border" />
              <div className="px-3 py-1 font-semibold tracking-wider text-[10px] text-muted-foreground uppercase">
                Triggers
              </div>
              {visibleTriggers.map((entry) => (
                <PaletteEntryRow
                  key={entry.kind}
                  kind={entry.kind}
                  label={entry.label}
                  description={entry.description}
                  disabled={disabled}
                  onClick={() => onAdd(entry.kind)}
                />
              ))}
            </>
          ) : null}
        </div>
      </PaletteShell>
    );
  }

  const bucket = BUCKETS.find((b) => b.id === view)!;
  const term = search.trim();
  const allEntries = entriesForBucket(bucket);
  const visibleEntries = allEntries.filter((e) => matchesSearch(e, term));

  return (
    <PaletteShell>
      <PaletteHeader
        title={bucket.label}
        subtitle={bucket.description}
        leadIcon={bucket.icon}
        onBack={goRoot}
      />
      <PaletteSearch value={search} onChange={setSearch} />
      <div className="min-h-0 py-2 scrollbar-subtle flex-1 overflow-y-auto">
        {bucket.id === "apps" ? (
          <McpDirectoryList
            search={term}
            disabled={disabled}
            onPick={(entry) =>
              onAdd("core.tool_call", {
                name: entry.displayName,
                mcpDirectorySlug: entry.slug,
              })
            }
          />
        ) : bucket.id === "human" ? (
          <p className="px-3 py-6 text-xs text-center text-muted-foreground">
            Human review nodes land in a follow-up.
          </p>
        ) : visibleEntries.length === 0 ? (
          <p className="px-3 py-3 text-xs text-muted-foreground">No matches.</p>
        ) : (
          visibleEntries.map((entry) => (
            <PaletteEntryRow
              key={entry.kind}
              kind={entry.kind}
              label={entry.label}
              description={entry.description}
              disabled={disabled}
              onClick={() => onAdd(entry.kind)}
            />
          ))
        )}
      </div>
    </PaletteShell>
  );
}

function PaletteShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-full shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-background"
      style={{ width: 300 }}
    >
      {children}
    </div>
  );
}

interface PaletteHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly leadIcon?: LucideIcon;
  readonly onBack?: () => void;
}

function PaletteHeader({ title, subtitle, leadIcon: Icon, onBack }: PaletteHeaderProps) {
  return (
    <div className="gap-2 p-3 flex items-start border-b border-border">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mt-0.5 grid place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          style={{ width: 24, height: 24 }}
          aria-label="Back"
        >
          <ArrowLeft className="size-3.5" />
        </button>
      ) : null}
      {Icon ? <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : null}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
      </div>
    </div>
  );
}

function PaletteSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="p-2 border-b border-border">
      <div className="relative">
        <Search className="left-2 size-3.5 absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-8 pl-7 text-xs"
          placeholder="Search nodes..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function BucketRow({ bucket, onClick }: { bucket: BucketMeta; onClick: () => void }) {
  const Icon = bucket.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group gap-3 px-3 py-2.5 flex w-full items-center text-left transition-colors hover:bg-muted/40"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{bucket.label}</div>
        <div className="text-xs text-muted-foreground">{bucket.description}</div>
      </div>
      <ChevronRight className="size-3.5 group-hover:translate-x-0.5 shrink-0 text-muted-foreground/70 transition-transform" />
    </button>
  );
}

interface PaletteEntryRowProps {
  readonly kind: string;
  readonly label: string;
  readonly description: string;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

function PaletteEntryRow({ kind, label, description, disabled, onClick }: PaletteEntryRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "gap-2.5 px-3 py-2 flex w-full items-center text-left transition-colors hover:bg-muted/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <NodeIcon kind={kind} size={14} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs truncate text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}

interface McpDirectoryListProps {
  readonly search: string;
  readonly disabled?: boolean;
  readonly onPick: (entry: McpDirectoryEntry) => void;
}

interface McpDirectoryEntry {
  readonly slug: string;
  readonly displayName: string;
  readonly oneLiner: string | null;
  readonly iconUrl: string | null;
}

function McpDirectoryList({ search, disabled, onPick }: McpDirectoryListProps) {
  const { data, isLoading, isError } = useMcpDirectoryListQuery(search);
  if (isLoading) {
    return <p className="px-3 py-6 text-xs text-center text-muted-foreground">Loading apps…</p>;
  }
  if (isError) {
    return (
      <p className="px-3 py-6 text-xs text-center text-destructive">Couldn&apos;t load apps.</p>
    );
  }
  const items = (data?.items ?? []) as McpDirectoryEntry[];
  if (items.length === 0) {
    return <p className="px-3 py-6 text-xs text-center text-muted-foreground">No matches.</p>;
  }
  return (
    <>
      {items.map((entry) => (
        <button
          key={entry.slug}
          type="button"
          onClick={() => onPick(entry)}
          disabled={disabled}
          className={cn(
            "gap-2.5 px-3 py-2 flex w-full items-center text-left transition-colors hover:bg-muted/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span
            className="grid shrink-0 place-items-center rounded-md border border-border bg-background"
            style={{ width: 28, height: 28 }}
          >
            {entry.iconUrl ? (
              // Directory icons come from anywhere; using a plain <img> avoids
              // having to allowlist every CDN in next.config remotePatterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.iconUrl}
                alt=""
                width={18}
                height={18}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="font-semibold text-[10px] text-muted-foreground uppercase">
                {entry.displayName.slice(0, 2)}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate text-foreground">{entry.displayName}</div>
            {entry.oneLiner ? (
              <div className="text-xs truncate text-muted-foreground">{entry.oneLiner}</div>
            ) : null}
          </div>
        </button>
      ))}
    </>
  );
}

// Re-exported in case other features want category-icon parity for badges.
export { Sparkles, Zap };
