import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Section,
  Text,
} from "@react-email/components";

interface OtpEmailProps {
  token: string;
  actionType: "signup" | "magiclink";
}

export function OtpEmail({ token, actionType }: OtpEmailProps) {
  const heading =
    actionType === "signup" ? "Confirm your email" : "Your sign-in code";
  const subtext =
    actionType === "signup"
      ? "Enter the code below to complete your sign-up. It expires in 10 minutes."
      : "Enter the code below to sign in to Mirrorverse. It expires in 10 minutes.";

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>{heading}</Heading>
          <Text style={subtitle}>{subtext}</Text>
          <Section style={codeBlock}>
            <Text style={codeText}>{token}</Text>
          </Section>
          <Text style={footer}>
            If you didn&apos;t request this, you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={brand}>Mirrorverse</Text>
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
  maxWidth: "480px",
  margin: "0 auto",
  padding: "48px 24px",
};
const h1: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 8px",
};
const subtitle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "15px",
  margin: "0 0 32px",
};
const codeBlock: React.CSSProperties = {
  background: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center",
  marginBottom: "32px",
};
const codeText: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "10px",
  color: "#111827",
  margin: 0,
};
const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "13px",
};
const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};
const brand: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: 0,
};
