"use client";

import { ExternalLink, KeyRound } from "lucide-react";
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
  function handleConnect() {
    window.open(redirectUrl, "_blank", "noopener,noreferrer,width=600,height=700");
    onDismiss();
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
            The agent needs access to {appSlug} to continue. Connect your account to proceed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDismiss}>
            Cancel
          </Button>
          <Button onClick={handleConnect}>
            <ExternalLink className="size-4" />
            Connect {appSlug}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
