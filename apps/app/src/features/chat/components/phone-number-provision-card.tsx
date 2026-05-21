import Link from "next/link";
import { Phone, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  readPhoneProvisionOutput,
  type PhoneProvisionToolPart,
  type ByoTwilioToolPart,
} from "@/features/chat/lib/phone-tools";

interface PhoneNumberProvisionCardProps {
  part: PhoneProvisionToolPart | ByoTwilioToolPart;
}

export function PhoneNumberProvisionCard({ part }: PhoneNumberProvisionCardProps) {
  const output = readPhoneProvisionOutput(part);
  const isLoading = part.state !== "output-available" && part.state !== "output-error";
  const isError = !isLoading && (!output || !output.ok);
  const errorText =
    part.state === "output-error"
      ? (part as { errorText?: string }).errorText
      : !output?.ok
        ? output?.error
        : undefined;

  return (
    <div className="my-3 gap-3 p-4 flex items-center rounded-2xl border border-border bg-card">
      <div
        className={
          isLoading
            ? "size-9 grid shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
            : isError
              ? "size-9 grid shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive"
              : "size-9 bg-green-500/10 text-green-600 grid shrink-0 place-items-center rounded-xl"
        }
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isError ? (
          <AlertCircle className="size-4" />
        ) : (
          <CheckCircle className="size-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">
          {isLoading
            ? "Provisioning number…"
            : isError
              ? "Failed to provision number"
              : "Phone number ready"}
        </div>
        {!isLoading && output?.ok ? (
          <div className="mt-0.5 text-xs font-mono text-muted-foreground">{output.number}</div>
        ) : null}
        {isError && errorText ? (
          <div className="mt-1 text-xs line-clamp-2 text-destructive">{errorText}</div>
        ) : null}
      </div>

      {output?.ok ? (
        <Button asChild size="sm" variant="outline" className="h-8 shrink-0">
          <Link href={`/deploy/phone/${output.phoneNumberId}`}>
            <Phone className="mr-1.5 size-3.5" />
            View
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
