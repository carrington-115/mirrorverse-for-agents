"use client";

import { useState } from "react";
import { ExternalLink, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CredentialInterruptDialogProps {
  appSlug: string;
  redirectUrl: string;
  onDismiss: () => void;
}

export function CredentialInterruptDialog({
  appSlug,
  redirectUrl,
  onDismiss,
}: CredentialInterruptDialogProps) {
  const [state, setState] = useState<"idle" | "waiting">("idle");

  function handleConnect() {
    window.open(redirectUrl, "_blank", "noopener,noreferrer,width=600,height=700");
    setState("waiting");
    // Do NOT call onDismiss here — keep polling active until connection resolves.
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 size-10 flex items-center justify-center rounded-full bg-muted">
            <KeyRound className="size-5 text-muted-foreground" />
          </div>
          <DialogTitle>Connect {appSlug}</DialogTitle>
          <DialogDescription>
            {state === "idle"
              ? `The agent needs access to ${appSlug} to continue. Connect your account to proceed.`
              : `Waiting for your ${appSlug} connection to complete. You can close the popup once you&apos;ve authorized.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDismiss}>
            Cancel
          </Button>
          {state === "idle" ? (
            <Button onClick={handleConnect}>
              <ExternalLink className="size-4" />
              Connect {appSlug}
            </Button>
          ) : (
            <Button disabled>
              <Loader2 className="size-4 animate-spin" />
              Connecting&hellip;
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
