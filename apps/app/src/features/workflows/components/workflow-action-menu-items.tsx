"use client";

import {
  Copy,
  Loader2,
  MessageSquare,
  MessageSquareOff,
  Pencil,
  Play,
  Power,
  PowerOff,
  RefreshCw,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { Workflow } from "@/lib/types";
import {
  useActivateWorkflowMutation,
  useDeactivateWorkflowMutation,
  useRestartWorkflowMutation,
  useRunWorkflowMutation,
  useSetSlackAgentMutation,
} from "@/features/workflows/api/mutations";

export const KIND_LABELS: Record<Workflow["kind"], string> = {
  automation: "Automation",
  "chat-agent": "Chat agent",
  "voice-agent": "Voice agent",
  code: "Code",
};

export function WorkflowActionMenuItems({
  w,
  onRename,
  onDelete,
}: {
  w: Workflow;
  onRename: () => void;
  onDelete: () => void;
}) {
  const runMutation = useRunWorkflowMutation();
  const restartMutation = useRestartWorkflowMutation();
  const activateMutation = useActivateWorkflowMutation();
  const deactivateMutation = useDeactivateWorkflowMutation();
  const setSlackAgentMutation = useSetSlackAgentMutation();

  const isStatusToggling = activateMutation.isPending || deactivateMutation.isPending;

  const handleToggleStatus = () => {
    if (w.status === "active") {
      deactivateMutation.mutate(
        { workflowId: w.id },
        {
          onSuccess: () => toast.success(`"${w.name}" deactivated`),
          onError: (err) => toast.error(err.message || "Failed to deactivate workflow"),
        },
      );
    } else {
      activateMutation.mutate(
        { workflowId: w.id },
        {
          onSuccess: () => toast.success(`"${w.name}" activated`),
          onError: (err) => toast.error(err.message || "Failed to activate workflow"),
        },
      );
    }
  };

  return (
    <>
      <DropdownMenuItem
        disabled={runMutation.isPending}
        onClick={() =>
          runMutation.mutate(
            { workflowId: w.id },
            {
              onSuccess: () => toast.success("Run started"),
              onError: (err) => toast.error(err.message || "Failed to start run"),
            },
          )
        }
      >
        {runMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        Run workflow
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${window.location.origin}/workflows/${w.id}`);
            toast.success("Link copied");
          } catch {
            toast.error("Failed to copy link");
          }
        }}
      >
        <Copy className="size-4" />
        Copy link
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onRename}>
        <Pencil className="size-4" />
        Rename
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => toast.info(`Share "${w.name}" coming soon`)}>
        <Share2 className="size-4" />
        Share
      </DropdownMenuItem>
      <DropdownMenuItem disabled={isStatusToggling} onClick={handleToggleStatus}>
        {isStatusToggling ? (
          <Loader2 className="size-4 animate-spin" />
        ) : w.status === "active" ? (
          <PowerOff className="size-4" />
        ) : (
          <Power className="size-4" />
        )}
        {w.status === "active" ? "Deactivate" : "Activate"}
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={restartMutation.isPending || w.status !== "active"}
        onClick={() =>
          restartMutation.mutate(
            { workflowId: w.id },
            {
              onSuccess: () => toast.success(`"${w.name}" restarted`),
              onError: (err) => toast.error(err.message || "Failed to restart workflow"),
            },
          )
        }
      >
        {restartMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Restart workflow
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={setSlackAgentMutation.isPending}
        onClick={() =>
          setSlackAgentMutation.mutate(
            { workflowId: w.id, enabled: !w.respondsToSlackMentions },
            {
              onSuccess: () =>
                toast.success(
                  w.respondsToSlackMentions
                    ? `Slack replies disabled for "${w.name}"`
                    : `"${w.name}" will now reply to Slack mentions`,
                ),
              onError: (err) => toast.error(err.message || "Failed to update Slack agent"),
            },
          )
        }
      >
        {setSlackAgentMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : w.respondsToSlackMentions ? (
          <MessageSquareOff className="size-4" />
        ) : (
          <MessageSquare className="size-4" />
        )}
        {w.respondsToSlackMentions
          ? "Stop replying to Slack mentions"
          : "Respond to Slack mentions"}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
        <Trash2 className="size-4" />
        Delete
      </DropdownMenuItem>
    </>
  );
}
