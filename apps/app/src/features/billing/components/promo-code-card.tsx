"use client";

import { useState, type FormEvent } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useRedeemPromoCodeMutation } from "@/features/billing/api/mutations";
import { usePromoRedemptionsQuery } from "@/features/billing/api/queries";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PromoCodeCard() {
  const [code, setCode] = useState("");
  const redeem = useRedeemPromoCodeMutation();
  const { data: redemptions, isLoading } = usePromoRedemptionsQuery();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    redeem.mutate({ code: trimmed }, { onSuccess: () => setCode("") });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promo code</CardTitle>
        <CardDescription>
          Redeem a promo code to add bonus credits to this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-4 flex flex-col">
        <form onSubmit={handleSubmit} className="gap-2 flex items-end">
          <Field className="flex-1">
            <FieldLabel htmlFor="promo-code">Code</FieldLabel>
            <Input
              id="promo-code"
              placeholder="Promo code"
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (redeem.isError) redeem.reset();
              }}
              aria-invalid={redeem.isError}
            />
          </Field>
          <Button type="submit" size="sm" disabled={!code.trim() || redeem.isPending}>
            {redeem.isPending ? "Applying…" : "Apply"}
          </Button>
        </form>
        {redeem.isError && <p className="text-sm text-destructive">{redeem.error.message}</p>}

        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : redemptions && redemptions.length > 0 ? (
          <ul className="divide-y">
            {redemptions.map((r) => (
              <li key={r.id} className="py-3 text-sm flex items-center justify-between">
                <div className="gap-2 flex items-center">
                  <Gift className="size-4 text-muted-foreground" />
                  <span className="font-medium">{r.code}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
                <Badge variant="secondary">+{r.credits.toLocaleString()} credits</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
