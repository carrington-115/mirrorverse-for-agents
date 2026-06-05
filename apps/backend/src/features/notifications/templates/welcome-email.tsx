import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function WelcomeEmail({
  name,
  appUrl,
  unsubscribeUrl,
}: WelcomeEmailProps) {
  const firstName = name.split(" ")[0] ?? name;

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Welcome, {firstName} 👋</Heading>
          <Text style={intro}>
            You&apos;re all set on Mirrorverse. Here&apos;s what you can do
            next:
          </Text>

          <Section style={ctaSection}>
            <Button href={`${appUrl}/workflows`} style={btn}>
              Build a workflow
            </Button>
          </Section>
          <Section style={ctaSection}>
            <Button href={`${appUrl}/settings/channels`} style={btnSecondary}>
              Connect a channel
            </Button>
          </Section>
          <Section style={ctaSection}>
            <Button href={`${appUrl}/settings/members`} style={btnSecondary}>
              Invite a teammate
            </Button>
          </Section>

          <Text style={helpText}>
            Need help getting started? Reply to this email and we&apos;ll get
            back to you.
          </Text>
          <Hr style={hr} />
          <Text style={footerText}>
            Mirrorverse ·{" "}
            <a href={unsubscribeUrl} style={unsubLink}>
              Unsubscribe
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
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
  fontSize: "24px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 16px",
};
const intro: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  margin: "0 0 28px",
};
const ctaSection: React.CSSProperties = {
  marginBottom: "12px",
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
const btnSecondary: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  color: "#111827",
  borderRadius: "6px",
  padding: "12px 20px",
  fontSize: "14px",
  fontWeight: "500",
  textDecoration: "none",
  display: "inline-block",
};
const helpText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  marginTop: "32px",
};
const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};
const footerText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: 0,
};
const unsubLink: React.CSSProperties = {
  color: "#9ca3af",
  textDecoration: "underline",
};
