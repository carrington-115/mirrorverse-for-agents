"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createAgent } from "../actions";

interface CreateAgentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateAgentSheet({ open, onOpenChange }: CreateAgentSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deployTarget, setDeployTarget] = useState("customers");
  const [nameError, setNameError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setLoading(true);
    try {
      const newId = await createAgent(name, description, deployTarget);
      onOpenChange(false);
      setName("");
      setDescription("");
      setDeployTarget("customers");
      setNameError(false);
      router.push(`/agent/${newId}/workflows`);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    onOpenChange(false);
    setName("");
    setDescription("");
    setDeployTarget("customers");
    setNameError(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="min-w-[700px] max-w-full flex flex-col gap-0 p-0"
        showCloseButton={false}
      >
        <SheetHeader className="px-8 pt-8 pb-0">
          <SheetTitle className="text-[length:var(--heading-3-font-size)] font-semibold leading-[var(--heading-3-line-height)] tracking-[var(--heading-3-letter-spacing)] text-center">
            Agent information
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-8 py-[var(--lg)] flex flex-col gap-[var(--sm)]">
          {/* Name */}
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError(false);
            }}
            className={`w-full border-0 border-b-2 ${nameError ? "border-destructive" : "border-border"} rounded-none bg-transparent shadow-none outline-none px-[10px] py-[10px] text-[length:var(--heading-3-font-size)] font-semibold leading-[var(--heading-3-line-height)] tracking-[var(--heading-3-letter-spacing)] text-secondary-foreground placeholder:text-[color:rgba(155,155,155,0.6)] focus:ring-0`}
          />

          {/* Description */}
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border-0 border-b-2 border-border rounded-none bg-transparent shadow-none outline-none px-[10px] py-[10px] h-[281px] resize-none text-[length:var(--heading-3-font-size)] font-semibold leading-[var(--heading-3-line-height)] tracking-[var(--heading-3-letter-spacing)] text-secondary-foreground placeholder:text-[color:rgba(155,155,155,0.6)] focus:ring-0"
          />

          {/* Deployment radio group */}
          <div className="flex flex-col gap-[var(--2xs)] w-[320px]">
            <Label className="text-sm font-medium text-foreground">
              How are you deploying your agent?
            </Label>
            <RadioGroup
              value={deployTarget}
              onValueChange={setDeployTarget}
              className="flex flex-col gap-[var(--2xs)]"
            >
              <div className="flex items-center gap-[var(--xs)]">
                <RadioGroupItem value="customers" id="deploy-customers" />
                <Label
                  htmlFor="deploy-customers"
                  className="text-sm font-normal text-[color:var(--unofficial-foreground-alt)] cursor-pointer"
                >
                  Customers (inbound / outbound)
                </Label>
              </div>
              <div className="flex items-center gap-[var(--xs)]">
                <RadioGroupItem value="organization" id="deploy-org" />
                <Label
                  htmlFor="deploy-org"
                  className="text-sm font-normal text-[color:var(--unofficial-foreground-alt)] cursor-pointer"
                >
                  Organization (workflows / mirrropilot)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-8 pb-[var(--lg)] flex flex-col gap-[var(--sm)]">
          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create agent"}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleCancel}>
            Cancel
          </Button>
        </div>

        {/* Terms footer */}
        <div className="px-8 pb-6 flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center max-w-[350px]">
            By clicking continue, you agree to our{" "}
            <span className="underline cursor-pointer">Terms of Service</span>{" "}
            and{" "}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
