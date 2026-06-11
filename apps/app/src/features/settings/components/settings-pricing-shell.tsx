"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useCurrentPlanQuery } from "@/features/billing/api/queries";
import {
  useOpenPortalMutation,
  useCreateCheckoutSessionMutation,
} from "@/features/billing/api/mutations";

const PLANS = [
  {
    slug: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Explore the platform — no card required.",
    features: [
      "200 bonus credits",
      "100 tool calls",
      "5 integrations",
      "5 MB file uploads",
      "Limited models",
      "20 generations / mo",
      "100 runs / month",
    ],
    cta: "Current plan",
    isPopular: false,
  },
  {
    slug: "starter",
    name: "Starter",
    monthlyPrice: 49,
    annualPrice: 40,
    description: "For small teams automating their first workflows.",
    features: [
      "10,000 credits / mo",
      "5 phone numbers",
      "Unlimited integrations",
      "Unlimited file uploads",
      "Voice agents",
      "Less limited models",
      "30 generations / mo",
      "100 runs / day",
      "Email support",
      "Workflow Editor (v0)",
    ],
    cta: "Upgrade",
    isPopular: false,
  },
  {
    slug: "pro",
    name: "Pro",
    monthlyPrice: 149,
    annualPrice: 120,
    description: "For growing teams with advanced needs.",
    features: [
      "40,000 credits",
      "20 phone numbers",
      "Unlimited generations",
      "Unlimited tool calls",
      "1,000 runs / day",
      "Top & latest models",
      "SSO / SAML",
      "Email + video support",
    ],
    cta: "Upgrade",
    isPopular: true,
  },
  {
    slug: "custom",
    name: "Custom",
    monthlyPrice: null,
    annualPrice: null,
    description: "Dedicated infrastructure and custom SLAs.",
    features: ["Everything in Pro", "Unlimited phone numbers"],
    cta: "Contact sales",
    isPopular: false,
  },
] as const;

type PlanSlug = (typeof PLANS)[number]["slug"];

export function PricingSettingsShell() {
  const [annual, setAnnual] = useState(false);
  const { data } = useCurrentPlanQuery();
  const openPortal = useOpenPortalMutation();
  const createCheckout = useCreateCheckoutSessionMutation();

  const currentPlanSlug = data?.plan?.id ?? "free";
  const hasActiveSubscription =
    !!data?.subscription?.stripeSubscriptionId &&
    (data.subscription.status === "active" || data.subscription.status === "trialing");

  const handleUpgrade = (planSlug: PlanSlug) => {
    if (planSlug === "custom") {
      window.open("https://cal.com/frumark/mirrroagents", "_blank", "noopener,noreferrer");
      return;
    }
    if (planSlug === "free") return;

    if (hasActiveSubscription) {
      // Existing paid subscriber — manage via portal (plan change, cancel, etc.)
      openPortal.mutate({});
    } else {
      // New subscriber — launch Stripe Checkout
      createCheckout.mutate({
        planId: planSlug,
        billingInterval: annual ? "annual" : "monthly",
      });
    }
  };

  const isPending = openPortal.isPending || createCheckout.isPending;

  return (
    <div className="gap-6 flex flex-col">
      <div>
        <h1 className="text-lg font-semibold">Pricing</h1>
        <p className="text-sm text-muted-foreground">Choose the plan that fits your needs.</p>
      </div>
      <Separator />

      <div className="gap-3 flex items-center">
        <Label htmlFor="billing-toggle" className="text-sm text-muted-foreground">
          Monthly
        </Label>
        <Switch id="billing-toggle" checked={annual} onCheckedChange={setAnnual} />
        <Label htmlFor="billing-toggle" className="gap-1.5 text-sm flex items-center">
          Annual
          <Badge variant="secondary">Save 20%</Badge>
        </Label>
      </div>

      <div className="gap-4 sm:grid-cols-2 xl:grid-cols-4 grid grid-cols-1">
        {PLANS.map((plan) => {
          const isCurrent = plan.slug === currentPlanSlug;
          return (
            <Card key={plan.slug} className={cn(isCurrent && "ring-2 ring-primary/50")}>
              <CardHeader className="h-1/6">
                <div className="gap-2 flex items-start justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="gap-1.5 flex items-center">
                    {plan.isPopular && <Badge variant="secondary">Most popular</Badge>}
                    {isCurrent && <Badge variant="secondary">Current</Badge>}
                  </div>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="h-5/6">
                <div className="mb-4">
                  {plan.monthlyPrice === null ? (
                    <p className="text-2xl font-bold">Custom</p>
                  ) : plan.monthlyPrice === 0 ? (
                    <p className="text-2xl font-bold">Free</p>
                  ) : (
                    <p className="text-2xl font-bold transition-all duration-200">
                      ${annual ? plan.annualPrice : plan.monthlyPrice}
                      <span className="text-sm font-normal text-muted-foreground"> / mo</span>
                    </p>
                  )}
                </div>
                <ul className="gap-2 flex flex-col">
                  {plan.features.map((feature) => (
                    <li key={feature} className="gap-2 text-sm flex items-center">
                      <Check className="size-3.5 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="h-1/6 justify-end">
                {plan.slug === "custom" ? (
                  <Button className="w-full" size="sm" onClick={() => handleUpgrade("custom")}>
                    <Zap className="size-3.5" />
                    Contact sales
                  </Button>
                ) : isCurrent ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="w-full">
                        <Button className="w-full" variant="outline" size="sm" disabled>
                          Current plan
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>You&apos;re on the {plan.name} plan</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleUpgrade(plan.slug)}
                    disabled={isPending}
                  >
                    {plan.cta}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
