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

interface AvailableNumber {
  id: string;
  number: string;
  country: string;
  countryCode: string;
  type: "local" | "toll-free" | "mobile";
  capabilities: ("voice" | "sms" | "mms")[];
  monthlyFee: string;
}

const AVAILABLE_NUMBERS: AvailableNumber[] = [
  {
    id: "avail-1",
    number: "+1 (800) 555-0101",
    country: "United States",
    countryCode: "US",
    type: "toll-free",
    capabilities: ["voice", "sms"],
    monthlyFee: "$2.00",
  },
  {
    id: "avail-2",
    number: "+1 (415) 555-0132",
    country: "United States",
    countryCode: "US",
    type: "local",
    capabilities: ["voice", "sms", "mms"],
    monthlyFee: "$1.15",
  },
  {
    id: "avail-3",
    number: "+1 (212) 555-0178",
    country: "United States",
    countryCode: "US",
    type: "local",
    capabilities: ["voice", "sms"],
    monthlyFee: "$1.15",
  },
  {
    id: "avail-4",
    number: "+44 7700 900123",
    country: "United Kingdom",
    countryCode: "GB",
    type: "mobile",
    capabilities: ["voice", "sms"],
    monthlyFee: "$1.75",
  },
  {
    id: "avail-5",
    number: "+44 800 123 4567",
    country: "United Kingdom",
    countryCode: "GB",
    type: "toll-free",
    capabilities: ["voice"],
    monthlyFee: "$2.50",
  },
  {
    id: "avail-6",
    number: "+61 2 5550 1234",
    country: "Australia",
    countryCode: "AU",
    type: "local",
    capabilities: ["voice", "sms"],
    monthlyFee: "$1.50",
  },
  {
    id: "avail-7",
    number: "+49 30 12345678",
    country: "Germany",
    countryCode: "DE",
    type: "local",
    capabilities: ["voice"],
    monthlyFee: "$1.40",
  },
  {
    id: "avail-8",
    number: "+33 1 23 45 67 89",
    country: "France",
    countryCode: "FR",
    type: "local",
    capabilities: ["voice", "sms"],
    monthlyFee: "$1.40",
  },
  {
    id: "avail-9",
    number: "+55 11 5550-1234",
    country: "Brazil",
    countryCode: "BR",
    type: "local",
    capabilities: ["voice"],
    monthlyFee: "$1.20",
  },
  {
    id: "avail-10",
    number: "+91 22 5550 1234",
    country: "India",
    countryCode: "IN",
    type: "local",
    capabilities: ["voice", "sms"],
    monthlyFee: "$0.90",
  },
];

const COUNTRIES = [
  { value: "all", label: "All countries" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
];

const NUMBER_TYPES = [
  { value: "all", label: "All types" },
  { value: "local", label: "Local" },
  { value: "toll-free", label: "Toll-free" },
  { value: "mobile", label: "Mobile" },
];

const TYPE_LABELS: Record<string, string> = {
  local: "Local",
  "toll-free": "Toll-free",
  mobile: "Mobile",
};

interface PhoneNumbersListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhoneNumbersListSheet({ open, onOpenChange }: PhoneNumbersListSheetProps) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [numberType, setNumberType] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setSearch("");
      setCountry("all");
      setNumberType("all");
      setSelectedId(null);
    }, 300);
  }

  function handleSubmit() {
    handleClose();
  }

  const filtered = AVAILABLE_NUMBERS.filter((n) => {
    const q = search.toLowerCase();
    const matchesSearch = n.number.toLowerCase().includes(q) || n.country.toLowerCase().includes(q);
    const matchesCountry = country === "all" || n.countryCode === country;
    const matchesType = numberType === "all" || n.type === numberType;
    return matchesSearch && matchesCountry && matchesType;
  });

  const selectedNumber = AVAILABLE_NUMBERS.find((n) => n.id === selectedId);

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
              placeholder="Search by number or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="gap-2 flex">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="flex-1">
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
            <Select value={numberType} onValueChange={setNumberType}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUMBER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-sm flex items-center justify-center text-muted-foreground">
              No numbers match your filters.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n) => {
                const isSelected = n.id === selectedId;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : n.id)}
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
                        <span className="text-sm font-medium font-mono">{n.number}</span>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {TYPE_LABELS[n.type]}
                        </Badge>
                      </div>
                      <div className="mt-0.5 gap-2 flex items-center">
                        <span className="text-xs text-muted-foreground">{n.country}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground">
                          {n.capabilities.join(", ")}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm shrink-0 text-muted-foreground">
                      {n.monthlyFee}/mo
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedNumber && (
          <div className="px-6 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Selected:{" "}
              <span className="font-medium font-mono text-foreground">{selectedNumber.number}</span>{" "}
              — {selectedNumber.monthlyFee}/month
            </p>
          </div>
        )}

        <div className="px-6 py-4 flex items-center justify-between border-t border-border">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedId}>
            Add number
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
