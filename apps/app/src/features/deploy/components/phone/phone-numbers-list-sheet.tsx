"use client";

import { useState } from "react";
import { Search, Phone, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSearchNumbersQuery } from "@/features/deploy/api/queries";
import { useBuyNumberMutation } from "@/features/deploy/api/mutations";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
];

interface PhoneNumbersListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhoneNumbersListSheet({ open, onOpenChange }: PhoneNumbersListSheetProps) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("US");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: results = [], isLoading } = useSearchNumbersQuery(
    { countryCode: country, contains: search || undefined, source: "managed" },
    open,
  );

  const { mutate: buyNumber, isPending } = useBuyNumberMutation();

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setSearch("");
      setCountry("US");
      setSelectedId(null);
    }, 300);
  }

  function handleSubmit() {
    if (!selectedId) return;
    buyNumber(
      { phoneNumber: selectedId, source: "managed" },
      {
        onSuccess: () => {
          toast.success("Phone number added successfully");
          handleClose();
        },
        onError: () => toast.error("Failed to add phone number. Please try again."),
      },
    );
  }

  function capsToString(caps: { voice: boolean; sms: boolean; mms: boolean }) {
    return (["voice", "sms", "mms"] as const).filter((k) => caps[k]).join(", ");
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="gap-0 p-0 flex max-w-full min-w-[600px] flex-col">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <div className="gap-2 flex items-center">
            <Phone className="size-5 text-muted-foreground" />
            <SheetTitle className="text-base">Browse available phone numbers</SheetTitle>
          </div>
          <SheetDescription>
            Select a phone number from the list below to add to your account.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4 gap-3 flex flex-col border-b border-border">
          <div className="relative">
            <Search className="left-3 size-3.5 absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by digits or area code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-16 text-sm flex items-center justify-center text-muted-foreground">
              Searching available numbers...
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-sm flex items-center justify-center text-muted-foreground">
              No numbers available for the selected filters.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {results.map((n) => {
                const isSelected = n.phoneNumber === selectedId;
                return (
                  <button
                    key={n.phoneNumber}
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : n.phoneNumber)}
                    className={`px-6 py-4 gap-4 flex w-full items-center text-left transition-colors hover:bg-accent ${
                      isSelected ? "bg-accent" : ""
                    }`}
                  >
                    <div
                      className={`size-5 flex shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-foreground bg-foreground"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {isSelected && <Check className="size-3 text-background" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="gap-2 flex items-center">
                        <span className="text-sm font-medium font-mono">{n.phoneNumber}</span>
                        <Badge variant="secondary" className="text-xs">
                          {capsToString(n.capabilities)}
                        </Badge>
                      </div>
                      {(n.locality ?? n.region) && (
                        <div className="mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {[n.locality, n.region].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedId && (
          <div className="px-6 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium font-mono text-foreground">{selectedId}</span>
            </p>
          </div>
        )}

        <div className="px-6 py-4 flex items-center justify-between border-t border-border">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedId || isPending}>
            {isPending ? "Adding..." : "Add number"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
