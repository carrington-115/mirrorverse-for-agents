import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface PricingCardProps {
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  isAnnual: boolean;
  badge?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}

export function PricingCard({
  name,
  monthlyPrice,
  annualPrice,
  isAnnual,
  badge,
  description,
  features,
  ctaLabel,
  ctaHref,
  highlighted = false,
}: PricingCardProps) {
  const displayPrice = monthlyPrice === null ? null : isAnnual ? annualPrice : monthlyPrice;

  return (
    <Card className={cn("flex flex-col justify-between", highlighted && "ring-2 ring-primary/60")}>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        {badge && (
          <CardAction>
            <Badge variant="secondary">{badge}</Badge>
          </CardAction>
        )}
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="gap-4 flex flex-col">
        <div>
          {displayPrice === null ? (
            <p className="text-2xl font-bold">Custom</p>
          ) : displayPrice === 0 ? (
            <p className="text-2xl font-bold">Free</p>
          ) : (
            <p className="text-2xl font-bold transition-all duration-200">
              ${displayPrice}
              <span className="text-sm font-normal text-muted-foreground"> / mo</span>
            </p>
          )}
        </div>

        <ul className="gap-2 flex flex-col">
          {features.map((feature) => (
            <li key={feature} className="gap-2 text-sm flex items-center">
              <Check className="size-3.5 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button className="w-full" size="sm" asChild>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
