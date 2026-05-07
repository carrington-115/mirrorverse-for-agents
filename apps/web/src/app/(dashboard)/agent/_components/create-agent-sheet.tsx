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
        className="gap-0 p-0 flex max-w-full min-w-[700px] flex-col"
        showCloseButton={false}
      >
        <SheetHeader className="px-8 pt-8 pb-0">
          <SheetTitle className="font-semibold text-center text-(length:--heading-3-font-size) leading-(--heading-3-line-height) tracking-(--heading-3-letter-spacing)">
            Agent information
          </SheetTitle>
        </SheetHeader>

        <div className="px-8 flex flex-1 flex-col gap-(--sm) overflow-y-auto py-(--lg)">
          {/* Name */}
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (e.target.value.trim()) setNameError(false);
            }}
            className={`w-full border-0 border-b-2 ${nameError ? "border-destructive" : "border-border"} font-semibold rounded-none bg-transparent p-[10px] text-(length:--heading-3-font-size) leading-(--heading-3-line-height) tracking-(--heading-3-letter-spacing) text-secondary-foreground shadow-none outline-none placeholder:text-[rgba(155,155,155,0.6)] focus:ring-0`}
          />

          {/* Description */}
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="font-semibold h-[281px] w-full resize-none rounded-none border-0 border-b-2 border-border bg-transparent p-[10px] text-(length:--heading-3-font-size) leading-(--heading-3-line-height) tracking-(--heading-3-letter-spacing) text-secondary-foreground shadow-none outline-none placeholder:text-[rgba(155,155,155,0.6)] focus:ring-0"
          />

          {/* Deployment radio group */}
          <div className="flex w-[320px] flex-col gap-(--2xs)">
            <Label className="text-sm font-medium text-foreground">
              How are you deploying your agent?
            </Label>
            <RadioGroup
              value={deployTarget}
              onValueChange={setDeployTarget}
              className="flex flex-col gap-(--2xs)"
            >
              <div className="flex items-center gap-(--xs)">
                <RadioGroupItem value="customers" id="deploy-customers" />
                <Label
                  htmlFor="deploy-customers"
                  className="text-sm font-normal cursor-pointer text-(--unofficial-foreground-alt)"
                >
                  Customers (inbound / outbound)
                </Label>
              </div>
              <div className="flex items-center gap-(--xs)">
                <RadioGroupItem value="organization" id="deploy-org" />
                <Label
                  htmlFor="deploy-org"
                  className="text-sm font-normal cursor-pointer text-(--unofficial-foreground-alt)"
                >
                  Organization (workflows / mirrropilot)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-8 flex flex-col gap-(--sm) pb-(--lg)">
          <Button className="w-full" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create agent"}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleCancel}>
            Cancel
          </Button>
        </div>

        {/* Terms footer */}
        <div className="px-8 pb-6 flex items-center justify-center">
          <p className="text-xs max-w-[350px] text-center text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <span className="cursor-pointer underline">Terms of Service</span> and{" "}
            <span className="cursor-pointer underline">Privacy Policy</span>.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
