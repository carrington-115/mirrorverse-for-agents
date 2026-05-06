"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, GripVertical, Ellipsis, Play, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Agent } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/date";
import AgentStatusBadge from "./AgentStatusBadge";
import ChannelEmptyState from "../../deploy/_components/ChannelEmptyState";

interface AgentTableProps {
  agents: Agent[];
  onCreateAgent: () => void;
  onBrowseTemplates: () => void;
  hasFilter?: boolean;
}

export default function AgentTable({
  agents,
  onCreateAgent,
  onBrowseTemplates,
  hasFilter,
}: AgentTableProps) {
  const router = useRouter();
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...agents].sort((a, b) =>
    sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  );

  return (
    <div className="rounded-lg border border-border overflow-hidden w-full">
      {/* Header row */}
      <div className="flex h-9 items-center bg-[var(--accent-0)] border-b border-border">
        {/* Drag handle space */}
        <div className="w-[38px] shrink-0" />
        {/* Checkbox */}
        <div className="w-[33px] shrink-0 flex items-center justify-center px-2">
          <Checkbox className="size-[14px]" />
        </div>
        {/* Name — sortable */}
        <button
          type="button"
          className="flex items-center gap-2 px-2 py-2 flex-1 text-left"
          onClick={() => setSortAsc((v) => !v)}
        >
          <span className="text-sm font-medium text-foreground">Name</span>
          <ArrowUpDown className="size-4 opacity-50" />
        </button>
        {/* Status */}
        <div className="w-[212px] shrink-0 px-2 py-2">
          <span className="text-sm font-medium text-foreground">Status</span>
        </div>
        {/* Last used */}
        <div className="w-[187px] shrink-0 px-2 py-2">
          <span className="text-sm font-medium text-foreground">Last used</span>
        </div>
        {/* Last updated */}
        <div className="w-[208px] shrink-0 px-2 py-2">
          <span className="text-sm font-medium text-foreground">
            Last updated
          </span>
        </div>
        {/* Actions spacer */}
        <div className="w-[181px] shrink-0" />
      </div>

      {/* Body */}
      {sorted.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center pb-4">
          <ChannelEmptyState
            title="No Agents Created Yet"
            description="Create your first agent to automate tasks across your organization, from answering customer questions and booking meetings to managing HR onboarding and more, all with shared memory and multi-channel support."
            primaryLabel="Create your first agent"
            secondaryLabel="Template library"
            onPrimary={() => toast.message("Creating agents is on the way")}
            onSecondary={() => toast.message("Agent template is on the way")}
          />
        </div>
      ) : (
        sorted.map((agent) => (
          <div
            key={agent.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/agent/${agent.id}/configuration`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/agent/${agent.id}/configuration`);
              }
            }}
            className="flex items-center border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer"
          >
            {/* Drag handle */}
            <div
              className="w-[38px] shrink-0 flex items-center justify-center py-2 px-1"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="size-4 text-muted-foreground opacity-50 cursor-grab" />
            </div>
            {/* Checkbox */}
            <div
              className="w-[33px] shrink-0 flex items-center justify-center px-2 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox className="size-[14px]" />
            </div>
            {/* Name */}
            <div className="flex-1 px-2 py-[7.5px]">
              <span className="text-sm text-foreground">{agent.name}</span>
            </div>
            {/* Status */}
            <div className="w-[212px] shrink-0 px-2 py-[7.5px]">
              <AgentStatusBadge status={agent.status} />
            </div>
            {/* Last used */}
            <div className="w-[187px] shrink-0 px-2 py-[7.5px]">
              <div className="flex flex-col">
                <span className="text-sm text-foreground leading-5">
                  {formatDate(agent.lastUsed)}
                </span>
                <span className="text-xs text-muted-foreground leading-4">
                  {formatTime(agent.lastUsed)}
                </span>
              </div>
            </div>
            {/* Last updated */}
            <div className="w-[208px] shrink-0 px-2 py-[7.5px]">
              <div className="flex flex-col">
                <span className="text-sm text-foreground leading-5">
                  {formatDate(agent.lastUpdated)}
                </span>
                <span className="text-xs text-muted-foreground leading-4">
                  {formatTime(agent.lastUpdated)}
                </span>
              </div>
            </div>
            {/* Actions */}
            <div
              className="w-[181px] shrink-0 flex items-center gap-1 px-2 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Ellipsis className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => toast.info("Edit coming soon")}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toast.info("Duplicate coming soon")}
                  >
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => toast.info("Delete coming soon")}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => toast.info("Run agent coming soon")}
              >
                <Play className="size-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
