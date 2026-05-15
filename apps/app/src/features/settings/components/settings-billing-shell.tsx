"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard } from "lucide-react";
import Link from "next/link";
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
import { useSupabaseUser } from "@/features/auth/hooks/use-supabase-user";

export function BillingSettingsShell() {
  const { user } = useSupabaseUser();
  const userEmail = user?.email ?? "";

  const [billingEmail, setBillingEmail] = useState("");
  const isDirty = useRef(false);

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

  const handleAddPayment = () => {
    toast.info("Payment method management — coming soon");
  };

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
            <Badge variant="secondary">Free</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="font-medium">Free</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant="outline">Active</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Next renewal</dt>
              <dd className="text-muted-foreground">N/A</dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter>
          <Button asChild size="sm">
            <Link href="/settings/pricing">Upgrade plan</Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment method</CardTitle>
          <CardDescription>Your default payment method for billing.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="gap-3 py-6 flex flex-col items-center text-center">
            <div className="p-3 rounded-full bg-muted">
              <CreditCard className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No payment method added.</p>
            <p className="text-xs text-muted-foreground">Required to upgrade to a paid plan.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button size="sm" onClick={handleAddPayment}>
            Add payment method
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
              onClick={() => toast.info("Invoice download — coming soon")}
            >
              Download all
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="gap-2 py-6 flex flex-col items-center text-center">
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
