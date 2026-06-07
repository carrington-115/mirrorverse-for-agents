"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseUser } from "@/features/auth/hooks/use-supabase-user";
import { useCurrentPlanQuery, useInvoicesQuery } from "@/features/billing/api/queries";
import { useOpenPortalMutation } from "@/features/billing/api/mutations";
import { useSettingsModal } from "../hooks/use-settings-modal";

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function BillingSettingsShell() {
  const { navigateTo } = useSettingsModal();
  const { user } = useSupabaseUser();
  const userEmail = user?.email ?? "";

  const [billingEmail, setBillingEmail] = useState("");
  const isDirty = useRef(false);

  const { data: planData, isLoading: planLoading } = useCurrentPlanQuery();
  const { data: invoiceData, isLoading: invoicesLoading } = useInvoicesQuery(10);
  const openPortal = useOpenPortalMutation();

  useEffect(() => {
    if (userEmail && !isDirty.current) {
      setBillingEmail(userEmail);
    }
  }, [userEmail]);

  const handleEmailChange = (value: string) => {
    isDirty.current = true;
    setBillingEmail(value);
  };

  const handleSaveEmail = () => {
    toast.info("Billing email — coming soon");
  };

  const planName = planData?.plan?.name ?? "Free";
  const subStatus = planData?.subscription?.status ?? "active";
  const periodEnd = planData?.subscription?.currentPeriodEnd;
  const isFree = !planData?.plan || planData.plan.monthlyPriceCents === 0;

  return (
    <div className="gap-6 max-w-2xl flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, payment method, and invoices.
        </p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <div className="gap-2 flex items-start justify-between">
            <div className="gap-1 flex flex-col">
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Your current plan and billing cycle.</CardDescription>
            </div>
            {planLoading ? (
              <Skeleton className="h-5 w-16 rounded-full" />
            ) : (
              <Badge variant="secondary">{planName}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="font-medium">
                {planLoading ? <Skeleton className="h-4 w-12" /> : planName}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant="outline" className="capitalize">
                  {subStatus}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Next renewal</dt>
              <dd className="text-muted-foreground">
                {planLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : isFree ? (
                  "N/A"
                ) : (
                  formatDate(periodEnd)
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter className="gap-2 flex">
          <Button size="sm" variant="outline" onClick={() => navigateTo("pricing")}>
            Upgrade plan
          </Button>
          {!isFree && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openPortal.mutate({})}
              disabled={openPortal.isPending}
            >
              <ExternalLink className="size-3.5" />
              Manage billing
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment method</CardTitle>
          <CardDescription>Your default payment method for billing.</CardDescription>
        </CardHeader>
        <CardContent>
          {planData?.subscription?.defaultPaymentMethod ? (
            <p className="text-sm">
              Card ending in ••••{" "}
              <span className="font-medium">
                {planData.subscription.defaultPaymentMethod.slice(-4)}
              </span>
            </p>
          ) : (
            <div className="gap-3 py-6 flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-muted">
                <CreditCard className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No payment method added.</p>
              <p className="text-xs text-muted-foreground">Required to upgrade to a paid plan.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button size="sm" onClick={() => openPortal.mutate({})} disabled={openPortal.isPending}>
            {planData?.subscription?.defaultPaymentMethod ? "Update" : "Add"} payment method
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing email</CardTitle>
          <CardDescription>Invoices and receipts will be sent to this address.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor="billing-email">Email</FieldLabel>
            <Input
              id="billing-email"
              type="email"
              placeholder="billing@example.com"
              value={billingEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
            />
          </Field>
        </CardContent>
        <CardFooter>
          <Button
            size="sm"
            onClick={handleSaveEmail}
            disabled={billingEmail.trim() === "" || billingEmail === userEmail}
          >
            Save
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Your billing history and receipts.</CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openPortal.mutate({})}
              disabled={openPortal.isPending}
            >
              View all
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="gap-2 flex flex-col">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !invoiceData || invoiceData.length === 0 ? (
            <div className="gap-2 py-6 flex flex-col items-center text-center">
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {invoiceData.map((inv) => (
                <li key={inv.id} className="py-3 text-sm flex items-center justify-between">
                  <div className="gap-1 flex flex-col">
                    <span className="font-medium">{formatDate(inv.periodStart)}</span>
                    <span className="text-xs text-muted-foreground capitalize">{inv.status}</span>
                  </div>
                  <div className="gap-3 flex items-center">
                    <span className="font-medium">{formatCents(inv.totalCents)}</span>
                    {inv.hostedInvoiceUrl && (
                      <a
                        href={inv.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground underline hover:text-foreground"
                      >
                        View
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
