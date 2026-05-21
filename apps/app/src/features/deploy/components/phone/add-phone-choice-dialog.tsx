"use client";

import { Phone } from "lucide-react";
import { SiTwilio } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AddPhoneChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTwilio: () => void;
  onSelectList: () => void;
}

export function AddPhoneChoiceDialog({
  open,
  onOpenChange,
  onSelectTwilio,
  onSelectList,
}: AddPhoneChoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add phone number</DialogTitle>
          <DialogDescription>
            Choose how you&apos;d like to add a phone number to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="gap-3 flex flex-col">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onSelectTwilio();
            }}
            className="gap-4 p-4 flex items-start rounded-lg border border-border text-left transition-colors hover:border-foreground/30 hover:bg-accent"
          >
            <div className="mt-0.5 size-9 flex shrink-0 items-center justify-center rounded-md bg-[#F22F46]/10">
              <SiTwilio className="size-4 text-[#F22F46]" />
            </div>
            <div className="gap-1 flex flex-col">
              <span className="text-sm font-medium">Use my Twilio account</span>
              <span className="text-xs text-muted-foreground">
                Connect an existing number from your Twilio account by entering your credentials.
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onSelectList();
            }}
            className="gap-4 p-4 flex items-start rounded-lg border border-border text-left transition-colors hover:border-foreground/30 hover:bg-accent"
          >
            <div className="mt-0.5 size-9 flex shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Phone className="size-4 text-primary" />
            </div>
            <div className="gap-1 flex flex-col">
              <span className="text-sm font-medium">Get a phone number</span>
              <span className="text-xs text-muted-foreground">
                Browse and select from a list of available phone numbers to provision instantly.
              </span>
            </div>
          </button>
        </div>

        <div className="pt-1 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
