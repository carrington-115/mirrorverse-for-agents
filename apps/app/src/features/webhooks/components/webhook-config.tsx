"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

import { env } from "@mirrorverse/env/app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useWebhookEndpointsQuery } from "../api/queries";
import { useRegenerateWebhookSecretMutation } from "../api/mutations";

interface WebhookConfigProps {
  workflowId: string;
  triggerNodeId: string;
  endpointSlug: string;
}

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return { copied, copy };
}

export function WebhookConfig({ workflowId, triggerNodeId, endpointSlug }: WebhookConfigProps) {
  const [secretVisible, setSecretVisible] = useState(false);
  const { data: endpoints, isLoading } = useWebhookEndpointsQuery();
  const regenerate = useRegenerateWebhookSecretMutation();

  const endpoint = endpoints?.find(
    (e) => e.workflowId === workflowId && e.triggerNodeId === triggerNodeId,
  );

  const webhookUrl = `${env.NEXT_PUBLIC_API_URL}/api/webhooks/${endpointSlug}`;

  const urlCopy = useCopy(webhookUrl);
  const secretCopy = useCopy(endpoint?.secret ?? "");

  function handleRegenerate() {
    if (!endpoint) return;
    regenerate.mutate(
      { endpointId: endpoint.id },
      {
        onSuccess: () => toast.success("Secret regenerated"),
        onError: () => toast.error("Failed to regenerate secret"),
      },
    );
  }

  async function handleTestRequest() {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      if (res.ok) {
        toast.success(`Test sent — ${res.status}`);
      } else {
        toast.error(`Request failed — ${res.status}`);
      }
    } catch {
      toast.error("Request failed — network error");
    }
  }

  if (isLoading) return null;

  return (
    <>
      <Separator />
      <div className="gap-2 flex flex-col">
        <Label className="text-xs">Webhook URL</Label>
        <div className="gap-1 flex items-center">
          <Input readOnly className="h-7 text-xs truncate font-mono" value={webhookUrl} />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={urlCopy.copy}
            title="Copy URL"
          >
            {urlCopy.copied ? (
              <Check className="size-3 text-green-500" />
            ) : (
              <Copy className="size-3" />
            )}
          </Button>
        </div>

        {endpoint ? (
          <>
            <Label className="text-xs mt-1">Secret</Label>
            <div className="gap-1 flex items-center">
              <Input
                readOnly
                type={secretVisible ? "text" : "password"}
                className="h-7 text-xs font-mono"
                value={endpoint.secret}
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => setSecretVisible((v) => !v)}
                title={secretVisible ? "Hide secret" : "Reveal secret"}
              >
                {secretVisible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={secretCopy.copy}
                title="Copy secret"
              >
                {secretCopy.copied ? (
                  <Check className="size-3 text-green-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
            </div>

            <div className="gap-2 mt-1 flex">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={handleRegenerate}
                disabled={regenerate.isPending}
              >
                <RefreshCw className="size-3 mr-1" />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => void handleTestRequest()}
              >
                <Send className="size-3 mr-1" />
                Test
              </Button>
            </div>
          </>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            Activate the workflow to get a secret and enable this endpoint.
          </p>
        )}
      </div>
    </>
  );
}
