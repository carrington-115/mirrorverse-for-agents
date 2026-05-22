"use client";

import { Phone, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  readPhoneSearchOutput,
  type AvailablePhoneNumber,
  type PhoneSearchToolPart,
} from "@/features/chat/lib/phone-tools";

interface PhoneNumberSelectionCardProps {
  part: PhoneSearchToolPart;
  onPhoneSelect?: (phoneNumber: string) => void;
}

const COUNTRY_LABELS: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  CA: "Canada",
  BR: "Brazil",
  IN: "India",
  JP: "Japan",
  MX: "Mexico",
};

function CapabilityBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <span className="px-1.5 py-0.5 font-medium inline-flex items-center rounded-sm bg-primary/10 text-[10px] text-primary">
      {label}
    </span>
  );
}

function NumberRow({ number, onSelect }: { number: AvailablePhoneNumber; onSelect?: () => void }) {
  const location = [number.locality, number.region].filter(Boolean).join(", ");
  return (
    <div className="gap-3 px-3 py-2.5 flex items-center justify-between rounded-lg transition-colors hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <div className="gap-2 flex flex-wrap items-center">
          <span className="text-sm font-medium font-mono text-foreground">
            {number.phoneNumber}
          </span>
          <div className="gap-1 flex items-center">
            <CapabilityBadge label="Voice" active={number.capabilities.voice} />
            <CapabilityBadge label="SMS" active={number.capabilities.sms} />
            <CapabilityBadge label="MMS" active={number.capabilities.mms} />
          </div>
        </div>
        {location ? (
          <div className="mt-0.5 text-xs truncate text-muted-foreground">{location}</div>
        ) : null}
      </div>
      {onSelect ? (
        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={onSelect}>
          Select
        </Button>
      ) : null}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="gap-3 px-3 py-2.5 flex items-center justify-between rounded-lg">
      <div className="space-y-1.5 flex-1">
        <div className="h-4 w-36 animate-pulse rounded-sm bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded-sm bg-muted" />
      </div>
      <div className="h-7 w-14 animate-pulse shrink-0 rounded-sm bg-muted" />
    </div>
  );
}

export function PhoneNumberSelectionCard({ part, onPhoneSelect }: PhoneNumberSelectionCardProps) {
  const output = readPhoneSearchOutput(part);
  const isLoading = part.state !== "output-available" && part.state !== "output-error";

  const countryLabel =
    output?.ok && COUNTRY_LABELS[output.country]
      ? COUNTRY_LABELS[output.country]
      : (output?.ok && output.country) || "your region";

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="gap-2.5 px-4 py-3 flex items-center border-b border-border">
        <div className="size-8 grid shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            {isLoading ? "Searching available numbers…" : `Available numbers in ${countryLabel}`}
          </div>
          {!isLoading && output?.ok ? (
            <div className="text-xs text-muted-foreground">
              {output.numbers.length === 0
                ? "No numbers found — try a different country or area code"
                : `${output.numbers.length} number${output.numbers.length === 1 ? "" : "s"} found`}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-1 divide-y divide-border/50">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)
          : output?.ok
            ? output.numbers.map((num) => (
                <NumberRow
                  key={num.phoneNumber}
                  number={num}
                  onSelect={onPhoneSelect ? () => onPhoneSelect(num.phoneNumber) : undefined}
                />
              ))
            : null}
        {!isLoading && output && !output.ok ? (
          <div className="px-3 py-3 text-sm text-destructive">{output.error}</div>
        ) : null}
      </div>
    </div>
  );
}
