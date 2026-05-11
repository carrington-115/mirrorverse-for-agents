"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";
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

const PLANS = [
  {
    slug: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Get started with basic agent workflows.",
    features: ["1 workflow", "100K tokens / mo", "Community support"],
    cta: "Current plan",
    isCurrent: true,
    isPopular: false,
  },
  {
    slug: "starter",
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 24,
    description: "For individuals and small teams.",
    features: ["10 workflows", "2M tokens / mo", "Voice agents", "Email support"],
    cta: "Upgrade",
    isCurrent: false,
    isPopular: false,
  },
  {
    slug: "pro",
    name: "Pro",
    monthlyPrice: 79,
    annualPrice: 66,
    description: "For growing teams with advanced needs.",
    features: ["Unlimited workflows", "10M tokens / mo", "Code nodes", "Priority support"],
    cta: "Upgrade",
    isCurrent: false,
    isPopular: true,
  },
  {
    slug: "business",
    name: "Business",
    monthlyPrice: 199,
    annualPrice: 166,
    description: "For organizations at scale.",
    features: ["Everything in Pro", "Custom MCP servers", "Audit log", "SSO", "SLA"],
    cta: "Upgrade",
    isCurrent: false,
    isPopular: false,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    description: "Custom pricing for large organizations.",
    features: ["Everything in Business", "Custom limits", "Dedicated support", "On-prem option"],
    cta: "Contact sales",
    isCurrent: false,
    isPopular: false,
  },
] as const;

export function PricingSettingsShell() {
  const [annual, setAnnual] = useState(false);

  const handleUpgrade = (planName: string) => {
    toast.info(`Upgrade to ${planName} — coming soon`);
  };

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
          <Badge variant="secondary">Save 17%</Badge>
        </Label>
      </div>

      <div className="gap-4 sm:grid-cols-2 xl:grid-cols-3 grid grid-cols-1">
        {PLANS.map((plan) => (
          <Card key={plan.slug} className={cn(plan.isCurrent && "ring-2 ring-primary/50")}>
            <CardHeader>
              <div className="gap-2 flex items-start justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <div className="gap-1.5 flex items-center">
                  {plan.isPopular && <Badge variant="secondary">Most popular</Badge>}
                  {plan.isCurrent && <Badge variant="secondary">Current</Badge>}
                </div>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
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
            <CardFooter>
              {plan.slug === "enterprise" ? (
                <Button className="w-full" size="sm" asChild>
                  <a href="mailto:sales@mirrorverse.ai">
                    <Zap className="size-3.5" />
                    Contact sales
                  </a>
                </Button>
              ) : plan.isCurrent ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full">
                      <Button className="w-full" variant="outline" size="sm" disabled>
                        Current plan
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>You&apos;re on the Free plan</TooltipContent>
                </Tooltip>
              ) : (
                <Button className="w-full" size="sm" onClick={() => handleUpgrade(plan.name)}>
                  {plan.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          onClick={() => toast.info("Feature comparison — coming soon")}
        >
          Compare all features
        </button>
      </div>
    </div>
  );
}
