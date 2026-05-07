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
import { Agent, AgentKnowledgeItem, AgentToolItem, AgentWorkflowRef } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/date";
import { ToolProviderIcon } from "../../_components/tool-icons";

interface ConnectedWorkflowPanelProps {
  agent: Agent;
  workflow: AgentWorkflowRef;
}

export default function ConnectedWorkflowPanel({ agent, workflow }: ConnectedWorkflowPanelProps) {
  const [preview, setPreview] = useState(true);
  const tools: AgentToolItem[] = agent.tools ?? [];
  const knowledgeBase: AgentKnowledgeItem[] = agent.knowledgeBase ?? [];

  return (
    <div className="flex w-full flex-col gap-(--sm)">
      <div className="flex items-center justify-between gap-(--md)">
        <div className="flex items-center gap-(--sm)">
          <h2 className="font-semibold text-(length:--heading-3-font-size) leading-(--heading-3-line-height) tracking-(--heading-3-letter-spacing) text-foreground">
            {workflow.name}
          </h2>
          <Badge
            variant="outline"
            className="text-xs font-semibold gap-(--2xs) rounded-full px-(--xs) py-(--3xs)"
          >
            <Clock className="size-3" />
            {formatTime(workflow.lastUpdated)}
          </Badge>
          <Badge
            variant="secondary"
            className="text-xs font-semibold gap-(--2xs) rounded-full px-(--xs) py-(--3xs)"
          >
            <Calendar className="size-3" />
            {formatDate(workflow.lastUpdated)}
          </Badge>
        </div>
        <Button
          variant="outline"
          className="min-h-9 shadow-xs gap-(--xs) rounded-lg"
          onClick={() => toast.info("Opening workflow — coming soon")}
        >
          <ExternalLink className="size-4" />
          Open workflow
        </Button>
      </div>

      <div className="flex items-start gap-(--lg)">
        <div className="flex w-[220px] shrink-0 flex-col gap-(--sm)">
          <div className="-space-x-2 flex items-center">
            <span className="size-8 bg-rose-600 text-white text-sm font-semibold flex items-center justify-center rounded-full border-2 border-background">
              M
            </span>
            <span className="size-8 bg-amber-500 text-white text-sm font-semibold flex items-center justify-center rounded-full border-2 border-background">
              A
            </span>
            <span className="size-8 bg-blue-600 text-white text-sm font-semibold flex items-center justify-center rounded-full border-2 border-background">
              J
            </span>
          </div>

          <div className="flex flex-col gap-(--md)">
            <Section
              icon={<Wrench className="size-3" />}
              label="Tools"
              href={`/agent/${agent.id}/tools`}
            >
              {tools.map((t) => (
                <Badge
                  key={t.id}
                  variant="secondary"
                  className="text-xs font-semibold gap-(--2xs) rounded-sm px-(--xs) py-(--3xs)"
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
                  className="text-xs font-semibold gap-(--2xs) rounded-sm px-(--xs) py-(--3xs)"
                >
                  <FileText className="size-3" />
                  {k.name}
                </Badge>
              ))}
            </Section>
          </div>

          <label className="gap-2 text-xs flex w-fit cursor-pointer items-center text-foreground select-none">
            <Switch checked={preview} onCheckedChange={setPreview} aria-label="Preview workflow" />
            Preview workflow
          </label>
        </div>

        <div className="min-w-0 h-[350px] flex-1 overflow-hidden rounded-3xl border border-border bg-(--accent-0)">
          {preview ? (
            <div className="flex size-full items-center justify-center">
              <div className="text-sm flex flex-col items-center gap-(--xs) text-muted-foreground">
                <Wrench className="size-6" />
                Workflow canvas preview
                <Link
                  href="#"
                  className="text-xs gap-1 inline-flex items-center underline"
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
            <div className="text-sm flex size-full items-center justify-center text-muted-foreground">
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
    <div className="text-xs font-semibold flex items-center gap-(--2xs) px-(--xs) py-(--3xs) text-(--foreground-alt)">
      {icon}
      {label}
    </div>
  );
  return (
    <div className="flex flex-col gap-(--2xs) border-l border-border">
      {href ? (
        <Link href={href} className="transition-colors hover:text-foreground">
          {header}
        </Link>
      ) : (
        header
      )}
      <div className="gap-1 flex flex-col pl-(--xs)">{children}</div>
    </div>
  );
}
