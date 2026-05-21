"use client";

import { useState } from "react";
import { SiTwilio } from "react-icons/si";
import { Phone } from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AddPhoneSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COUNTRY_CODES = [
  { value: "+1", label: "USA (+1)" },
  { value: "+44", label: "UK (+44)" },
  { value: "+91", label: "India (+91)" },
  { value: "+61", label: "Australia (+61)" },
  { value: "+49", label: "Germany (+49)" },
  { value: "+33", label: "France (+33)" },
  { value: "+81", label: "Japan (+81)" },
  { value: "+86", label: "China (+86)" },
  { value: "+55", label: "Brazil (+55)" },
  { value: "+237", label: "Cameroon (+237)" },
];

export function AddPhoneSheet({ open, onOpenChange }: AddPhoneSheetProps) {
  const [label, setLabel] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [communicationStatus, setCommunicationStatus] = useState("all");
  const [humanHandoff, setHumanHandoff] = useState(true);
  const [enableSms, setEnableSms] = useState(true);

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setLabel("");
      setCountryCode("+1");
      setPhoneNumber("");
      setAccountSid("");
      setAuthToken("");
      setCommunicationStatus("all");
      setHumanHandoff(true);
      setEnableSms(true);
    }, 300);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.error(
      'BYO Twilio setup is coming soon. Use "Browse available numbers" to add a managed number.',
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="gap-0 p-0 flex max-w-full min-w-[600px] flex-col">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <div className="gap-2 flex items-center">
            <SiTwilio className="size-5 text-[#F22F46]" />
            <SheetTitle className="text-base">Add phone number via Twilio</SheetTitle>
          </div>
          <SheetDescription>
            Connect your Twilio account to add a phone number for automated calls.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-6 flex-1 overflow-y-auto">
          <form id="add-phone-form" onSubmit={handleSubmit} className="gap-5 flex flex-col">
            <div className="gap-1.5 flex flex-col">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="e.g. Sales line"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>

            <div className="gap-3 grid grid-cols-[180px_1fr]">
              <div className="gap-1.5 flex flex-col">
                <Label htmlFor="country-code">Country code</Label>
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger id="country-code">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="gap-2 flex items-center">
                          <Phone className="size-3.5 text-muted-foreground" />
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="gap-1.5 flex flex-col">
                <Label htmlFor="phone-number">Phone number</Label>
                <Input
                  id="phone-number"
                  placeholder="(555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="gap-1.5 flex flex-col">
              <Label htmlFor="account-sid">Account SID</Label>
              <Input
                id="account-sid"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                required
              />
            </div>

            <div className="gap-1.5 flex flex-col">
              <Label htmlFor="auth-token">Auth Token</Label>
              <Input
                id="auth-token"
                type="password"
                placeholder="Your Twilio auth token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                required
              />
            </div>

            <div className="gap-4 pt-2 flex flex-col">
              <h3 className="text-sm font-medium">Advanced (optional)</h3>

              <div className="gap-1.5 flex flex-col">
                <Label htmlFor="communication-status">Communication status</Label>
                <Select value={communicationStatus} onValueChange={setCommunicationStatus}>
                  <SelectTrigger id="communication-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All (Outbound / Inbound)</SelectItem>
                    <SelectItem value="outbound">Outbound only</SelectItem>
                    <SelectItem value="inbound">Inbound only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="gap-4 p-4 flex items-start justify-between rounded-md border border-border">
                <div className="gap-1 flex flex-col">
                  <Label htmlFor="human-handoff" className="text-sm font-medium cursor-pointer">
                    Human Handoff Destination
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Designate this number as a handoff target when an agent escalates a call.
                  </p>
                </div>
                <Switch
                  id="human-handoff"
                  checked={humanHandoff}
                  onCheckedChange={setHumanHandoff}
                />
              </div>

              <div className="gap-4 p-4 flex items-start justify-between rounded-md border border-border">
                <div className="gap-1 flex flex-col">
                  <Label htmlFor="enable-sms" className="text-sm font-medium cursor-pointer">
                    Enable SMS Communication
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow this number to be used for SMS communication in this organization.
                  </p>
                </div>
                <Switch id="enable-sms" checked={enableSms} onCheckedChange={setEnableSms} />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 flex items-center justify-between border-t border-border">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-phone-form">
            Add number
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
