import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Text,
} from "@react-email/components";

export type BillingEmailVariant =
  | { variant: "trial_ending"; daysLeft: number; upgradeUrl: string }
  | { variant: "payment_failed"; portalUrl: string }
  | { variant: "plan_upgraded"; newPlan: string; appUrl: string }
  | { variant: "invoice_paid"; invoiceUrl: string; totalCents: number };

type BillingEmailProps = BillingEmailVariant;

export function BillingEmail(props: BillingEmailProps) {
  const content = resolveContent(props);
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Heading style={content.urgent ? h1Urgent : h1}>
            {content.heading}
          </Heading>
          <Text style={subtitle}>{content.body}</Text>
          {content.ctaUrl && content.ctaLabel && (
            <Button
              href={content.ctaUrl}
              style={content.urgent ? btnUrgent : btn}
            >
              {content.ctaLabel}
            </Button>
          )}
          <Hr style={hr} />
          <Text style={footer}>Mirrorverse</Text>
        </Container>
      </Body>
    </Html>
  );
}

function resolveContent(props: BillingEmailProps): {
  heading: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
  urgent?: boolean;
} {
  switch (props.variant) {
    case "trial_ending":
      return {
        heading: `Your trial ends in ${props.daysLeft} day${props.daysLeft === 1 ? "" : "s"}`,
        body: "Upgrade now to keep your workflows, channels, and integrations running without interruption.",
        ctaUrl: props.upgradeUrl,
        ctaLabel: "Upgrade my plan",
      };
    case "payment_failed":
      return {
        heading: "Payment failed",
        body: "We couldn&apos;t charge your payment method. Please update your billing details to avoid service interruption.",
        ctaUrl: props.portalUrl,
        ctaLabel: "Update payment method",
        urgent: true,
      };
    case "plan_upgraded":
      return {
        heading: `You're now on the ${props.newPlan} plan`,
        body: "Your upgrade is active. Head to the dashboard to explore your new features.",
        ctaUrl: props.appUrl,
        ctaLabel: "Go to dashboard",
      };
    case "invoice_paid": {
      const dollars = (props.totalCents / 100).toFixed(2);
      return {
        heading: "Payment confirmed",
        body: `We received your payment of $${dollars}. Your invoice is available below.`,
        ctaUrl: props.invoiceUrl,
        ctaLabel: "View invoice",
      };
    }
  }
}

const body: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};
const container: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto",
  padding: "48px 24px",
};
const h1: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 8px",
};
const h1Urgent: React.CSSProperties = {
  ...h1,
  color: "#dc2626",
};
const subtitle: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  margin: "0 0 28px",
};
const btn: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
  borderRadius: "6px",
  padding: "12px 20px",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
};
const btnUrgent: React.CSSProperties = {
  ...btn,
  backgroundColor: "#dc2626",
};
const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0 16px",
};
const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: 0,
};
