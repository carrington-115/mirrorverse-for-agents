"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiWhatsapp } from "react-icons/si";
import { CheckCircle2, Building2, Phone, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddWhatsAppSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 1 | 2 | 3;
type WabaOption = "new" | "existing";

const WABA_OPTIONS = [
  {
    id: "new" as WabaOption,
    icon: Building2,
    label: "Create new WABA",
    description:
      "Set up a new WhatsApp Business Account for your organization.",
  },
  {
    id: "existing" as WabaOption,
    icon: Smartphone,
    label: "Connect existing WABA",
    description: "Connect a WhatsApp Business Account you already have.",
  },
];

const MOCK_PHONE_OPTIONS = [
  { id: "p1", number: "+1 (555) 200-1000", country: "US" },
  { id: "p2", number: "+44 20 7946 0100", country: "UK" },
];

export default function AddWhatsAppSheet({
  open,
  onOpenChange,
}: AddWhatsAppSheetProps) {
  const [step, setStep] = useState<Step>(1);
  const [wabaOption, setWabaOption] = useState<WabaOption | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [about, setAbout] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsOfAgreement, setTermsOfAgreement] = useState("");

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setWabaOption(null);
      setSelectedPhone(null);
      setBusinessName("");
      setAbout("");
      setAddress("");
      setLogo("");
      setPrivacyPolicy("");
      setTermsOfAgreement("");
    }, 300);
  }

  function handleStep1Next() {
    if (!wabaOption) return;
    setStep(2);
  }

  function handleStep2Next() {
    if (!selectedPhone) return;
    setStep(3);
  }

  function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("WhatsApp number added successfully");
    handleClose();
  }

  const stepLabels = ["Add option", "Select phone", "Business info"];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="min-w-[600px] max-w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <SiWhatsapp className="size-5 text-[#25D366]" />
            <SheetTitle className="text-base">Add WhatsApp number</SheetTitle>
          </div>
          <SheetDescription>
            {step === 1 &&
              "Choose how you want to connect your WhatsApp Business Account."}
            {step === 2 &&
              "Select the phone number to use for this WhatsApp channel."}
            {step === 3 &&
              "Provide your business details for the WhatsApp profile."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-1.5 px-6 py-3 border-b border-border overflow-x-auto">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5 shrink-0">
              <div
                className={`flex items-center justify-center size-6 rounded-full text-xs font-medium transition-colors ${
                  step > s
                    ? "bg-green-600 text-white"
                    : step === s
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle2 className="size-3.5" /> : s}
              </div>
              <span
                className={`text-sm whitespace-nowrap ${
                  step === s
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {stepLabels[s - 1]}
              </span>
              {s < 3 && <div className="w-6 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div className="flex flex-col gap-3">
              {WABA_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWabaOption(opt.id)}
                    className={cn(
                      "flex items-start gap-3 border rounded-xl p-4 text-left transition-colors w-full",
                      wabaOption === opt.id
                        ? "border-foreground bg-muted"
                        : "border-border hover:border-foreground/40",
                    )}
                  >
                    <div className="flex items-center justify-center size-9 rounded-lg bg-background border border-border shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {opt.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "ml-auto size-4 rounded-full border-2 shrink-0 mt-0.5 transition-colors",
                        wabaOption === opt.id
                          ? "border-foreground bg-foreground"
                          : "border-border",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground mb-1">
                Select the phone number to assign to this WhatsApp channel.
              </p>
              {MOCK_PHONE_OPTIONS.map((phone) => (
                <button
                  key={phone.id}
                  type="button"
                  onClick={() => setSelectedPhone(phone.id)}
                  className={cn(
                    "flex items-center gap-3 border rounded-xl p-4 text-left transition-colors w-full",
                    selectedPhone === phone.id
                      ? "border-foreground bg-muted"
                      : "border-border hover:border-foreground/40",
                  )}
                >
                  <div className="flex items-center justify-center size-9 rounded-lg bg-background border border-border shrink-0">
                    <Phone className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium font-mono">
                      {phone.number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {phone.country}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "ml-auto size-4 rounded-full border-2 shrink-0 transition-colors",
                      selectedPhone === phone.id
                        ? "border-foreground bg-foreground"
                        : "border-border",
                    )}
                  />
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <form
              id="waba-step3"
              onSubmit={handleStep3Submit}
              className="flex flex-col gap-4"
            >
              {(() => {
                const phone = MOCK_PHONE_OPTIONS.find(
                  (p) => p.id === selectedPhone,
                );
                return phone ? (
                  <div className="flex items-center gap-2 bg-muted px-4 py-3 rounded-lg">
                    <SiWhatsapp className="size-5 text-[#25D366] shrink-0" />
                    <span className="text-sm font-medium font-mono">
                      {phone.number}
                    </span>
                    <span className="ml-1 text-xs font-semibold bg-purple-600 text-white px-2 py-0.5 rounded-lg">
                      Active
                    </span>
                  </div>
                ) : null;
              })()}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="biz-name">Business name</Label>
                <Input
                  id="biz-name"
                  placeholder="Mel's place"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  placeholder="Tell customers about your business..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Address (optional)</Label>
                <Input
                  id="address"
                  placeholder="Charlotte, North Carolina, US"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="logo">Logo</Label>
                <Select value={logo} onValueChange={setLogo}>
                  <SelectTrigger id="logo" className="w-full">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upload">Upload image</SelectItem>
                    <SelectItem value="url">Image URL</SelectItem>
                  </SelectContent>
                </Select>
                {logo === "upload" && (
                  <Input type="file" accept="image/*" className="mt-1" />
                )}
                {logo === "url" && (
                  <Input placeholder="https://example.com/logo.png" className="mt-1" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="privacy-policy">Privacy policy (optional)</Label>
                <Input
                  id="privacy-policy"
                  placeholder="https://"
                  value={privacyPolicy}
                  onChange={(e) => setPrivacyPolicy(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="terms">Terms of agreement (optional)</Label>
                <Input
                  id="terms"
                  placeholder="https://"
                  value={termsOfAgreement}
                  onChange={(e) => setTermsOfAgreement(e.target.value)}
                />
              </div>
            </form>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          {step === 1 ? (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setStep((s) => (s - 1) as Step)}
            >
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={step === 1 ? handleStep1Next : handleStep2Next}
              disabled={step === 1 ? !wabaOption : !selectedPhone}
            >
              Continue
            </Button>
          ) : (
            <Button type="submit" form="waba-step3">
              Add WhatsApp number
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
