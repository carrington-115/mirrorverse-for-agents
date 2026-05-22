"use client";

import { Phone, Loader2 } from "lucide-react";
import { SiTwilio } from "react-icons/si";

import { Button } from "@/components/ui/button";
import {
  readUnassignedNumbersOutput,
  type UnassignedNumber,
  type UnassignedNumbersToolPart,
} from "@/features/chat/lib/phone-tools";

interface UnassignedPhoneNumbersCardProps {
  part: UnassignedNumbersToolPart;
  onSelect?: (phoneNumberId: string) => void;
  onGetManagedNumber?: () => void;
  onByoTwilio?: () => void;
}

function CapabilityBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <span className="px-1.5 py-0.5 font-medium inline-flex items-center rounded-sm bg-primary/10 text-[10px] text-primary">
      {label}
    </span>
  );
}

function NumberRow({ number, onSelect }: { number: UnassignedNumber; onSelect?: () => void }) {
  return (
    <div className="gap-3 px-3 py-2.5 flex items-center justify-between rounded-lg transition-colors hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <div className="gap-2 flex flex-wrap items-center">
          <span className="text-sm font-medium font-mono text-foreground">{number.e164}</span>
          <div className="gap-1 flex items-center">
            <CapabilityBadge label="Voice" active={number.capabilities.voice} />
            <CapabilityBadge label="SMS" active={number.capabilities.sms} />
            <CapabilityBadge label="MMS" active={number.capabilities.mms} />
          </div>
        </div>
      </div>
      {onSelect ? (
        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={onSelect}>
          Use this number
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
      </div>
      <div className="h-7 w-28 animate-pulse shrink-0 rounded-sm bg-muted" />
    </div>
  );
}

function NoNumbersEmptyState({
  onGetManagedNumber,
  onByoTwilio,
}: {
  onGetManagedNumber?: () => void;
  onByoTwilio?: () => void;
}) {
  return (
    <div className="gap-3 p-3 flex flex-col">
      <p className="text-sm text-muted-foreground">
        You don&apos;t have any available phone numbers yet. Choose how you&apos;d like to get one:
      </p>
      <button
        type="button"
        onClick={onByoTwilio}
        className="gap-4 p-4 flex items-start rounded-lg border border-border text-left transition-colors hover:border-foreground/30 hover:bg-accent"
      >
        <div className="mt-0.5 size-9 flex shrink-0 items-center justify-center rounded-md bg-[#F22F46]/10">
          <SiTwilio className="size-4 text-[#F22F46]" />
        </div>
        <div className="gap-1 flex flex-col">
          <span className="text-sm font-medium">Use my Twilio number</span>
          <span className="text-xs text-muted-foreground">
            Connect an existing number from your Twilio account using your credentials.
          </span>
        </div>
      </button>
      <button
        type="button"
        onClick={onGetManagedNumber}
        className="gap-4 p-4 flex items-start rounded-lg border border-border text-left transition-colors hover:border-foreground/30 hover:bg-accent"
      >
        <div className="mt-0.5 size-9 flex shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Phone className="size-4 text-primary" />
        </div>
        <div className="gap-1 flex flex-col">
          <span className="text-sm font-medium">Get a phone number</span>
          <span className="text-xs text-muted-foreground">
            Browse available numbers and provision one instantly.
          </span>
        </div>
      </button>
    </div>
  );
}

export function UnassignedPhoneNumbersCard({
  part,
  onSelect,
  onGetManagedNumber,
  onByoTwilio,
}: UnassignedPhoneNumbersCardProps) {
  const output = readUnassignedNumbersOutput(part);
  const isLoading = part.state !== "output-available" && part.state !== "output-error";

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="gap-2.5 px-4 py-3 flex items-center border-b border-border">
        <div className="size-8 grid shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            {isLoading ? "Looking up available numbers…" : "Select a phone number"}
          </div>
          {!isLoading && output?.ok && output.numbers.length > 0 ? (
            <div className="text-xs text-muted-foreground">
              {output.numbers.length} number{output.numbers.length === 1 ? "" : "s"} available
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-1">
        {isLoading ? (
          <div className="divide-y divide-border/50">
            {Array.from({ length: 3 }, (_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : output?.ok ? (
          output.numbers.length > 0 ? (
            <div className="divide-y divide-border/50">
              {output.numbers.map((num) => (
                <NumberRow
                  key={num.id}
                  number={num}
                  onSelect={onSelect ? () => onSelect(num.id) : undefined}
                />
              ))}
            </div>
          ) : onGetManagedNumber || onByoTwilio ? (
            <NoNumbersEmptyState
              onGetManagedNumber={onGetManagedNumber}
              onByoTwilio={onByoTwilio}
            />
          ) : (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No phone numbers available
            </div>
          )
        ) : (
          <div className="px-3 py-3 text-sm text-destructive">{output?.error}</div>
        )}
      </div>
    </div>
  );
}
