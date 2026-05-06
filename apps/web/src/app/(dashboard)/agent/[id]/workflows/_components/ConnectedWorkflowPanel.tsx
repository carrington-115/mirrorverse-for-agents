"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Agent,
  AgentKnowledgeItem,
  AgentToolItem,
  AgentWorkflowRef,
} from "@/lib/types";
import { formatDate, formatTime } from "@/lib/date";
import { ToolProviderIcon } from "../../_components/tool-icons";

interface ConnectedWorkflowPanelProps {
  agent: Agent;
  workflow: AgentWorkflowRef;
}

export default function ConnectedWorkflowPanel({
  agent,
  workflow,
}: ConnectedWorkflowPanelProps) {
  const [preview, setPreview] = useState(true);
  const tools: AgentToolItem[] = agent.tools ?? [];
  const knowledgeBase: AgentKnowledgeItem[] = agent.knowledgeBase ?? [];

  return (
    <div className="flex flex-col gap-[var(--sm)] w-full">
      <div className="flex items-center justify-between gap-[var(--md)]">
        <div className="flex items-center gap-[var(--sm)]">
          <h2 className="text-[length:var(--heading-3-font-size)] font-semibold leading-[var(--heading-3-line-height)] tracking-[var(--heading-3-letter-spacing)] text-foreground">
            {workflow.name}
          </h2>
          <Badge
            variant="outline"
            className="rounded-full gap-[var(--2xs)] text-xs font-semibold px-[var(--xs)] py-[var(--3xs)]"
          >
            <Clock className="size-3" />
            {formatTime(workflow.lastUpdated)}
          </Badge>
          <Badge
            variant="secondary"
            className="rounded-full gap-[var(--2xs)] text-xs font-semibold px-[var(--xs)] py-[var(--3xs)]"
          >
            <Calendar className="size-3" />
            {formatDate(workflow.lastUpdated)}
          </Badge>
        </div>
        <Button
          variant="outline"
          className="rounded-[var(--radius-lg)] gap-[var(--xs)] min-h-9 shadow-xs"
          onClick={() => toast.info("Opening workflow — coming soon")}
        >
          <ExternalLink className="size-4" />
          Open workflow
        </Button>
      </div>

      <div className="flex items-start gap-[var(--lg)]">
        <div className="flex flex-col gap-[var(--sm)] shrink-0 w-[220px]">
          <div className="flex items-center -space-x-2">
            <span className="size-8 rounded-full bg-rose-600 border-2 border-background text-white text-sm font-semibold flex items-center justify-center">
              M
            </span>
            <span className="size-8 rounded-full bg-amber-500 border-2 border-background text-white text-sm font-semibold flex items-center justify-center">
              A
            </span>
            <span className="size-8 rounded-full bg-blue-600 border-2 border-background text-white text-sm font-semibold flex items-center justify-center">
              J
            </span>
          </div>

          <div className="flex flex-col gap-[var(--md)]">
            <Section
              icon={<Wrench className="size-3" />}
              label="Tools"
              href={`/agent/${agent.id}/tools`}
            >
              {tools.map((t) => (
                <Badge
                  key={t.id}
                  variant="secondary"
                  className="gap-[var(--2xs)] text-xs font-semibold px-[var(--xs)] py-[var(--3xs)] rounded-[var(--radius-sm)]"
                >
                  <ToolProviderIcon provider={t.provider} />
                  {t.providerLabel} {t.name.split("_").slice(1).join("_") || t.name}
                </Badge>
              ))}
            </Section>
            <Section
              icon={<BookOpen className="size-3" />}
              label="knowledge base"
              href={`/agent/${agent.id}/knowledge-base`}
            >
              {knowledgeBase.map((k) => (
                <Badge
                  key={k.id}
                  variant="secondary"
                  className="gap-[var(--2xs)] text-xs font-semibold px-[var(--xs)] py-[var(--3xs)] rounded-[var(--radius-sm)]"
                >
                  <FileText className="size-3" />
                  {k.name}
                </Badge>
              ))}
            </Section>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground select-none w-fit">
            <Switch
              checked={preview}
              onCheckedChange={setPreview}
              aria-label="Preview workflow"
            />
            Preview workflow
          </label>
        </div>

        <div className="flex-1 min-w-0 h-[350px] rounded-[var(--radius-3xl)] border border-border overflow-hidden bg-[var(--accent-0)]">
          {preview ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-[var(--xs)] text-muted-foreground text-sm">
                <Wrench className="size-6" />
                Workflow canvas preview
                <Link
                  href="#"
                  className="text-xs underline inline-flex items-center gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info("Opening workflow — coming soon");
                  }}
                >
                  Open in workflow builder
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              Preview disabled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  label,
  href,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  children: React.ReactNode;
}) {
  const header = (
    <div className="flex items-center gap-[var(--2xs)] px-[var(--xs)] py-[var(--3xs)] text-xs font-semibold text-[color:var(--foreground-alt)]">
      {icon}
      {label}
    </div>
  );
  return (
    <div className="border-l border-border flex flex-col gap-[var(--2xs)]">
      {href ? (
        <Link href={href} className="hover:text-foreground transition-colors">
          {header}
        </Link>
      ) : (
        header
      )}
      <div className="flex flex-col gap-1 pl-[var(--xs)]">{children}</div>
    </div>
  );
}
