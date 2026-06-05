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

interface EmailChangeProps {
  token: string;
  actionType: "email_change_new" | "email_change_current";
  newEmail?: string;
}

export function EmailChangeEmail({
  token,
  actionType,
  newEmail,
}: EmailChangeProps) {
  const isNew = actionType === "email_change_new";
  const heading = isNew
    ? "Confirm your new email"
    : "Your email is being changed";
  const subtext = isNew
    ? `Enter the code below to confirm ${newEmail ?? "your new email address"}.`
    : "Someone requested a change to the email on your Mirrorverse account.";

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
            If you didn&apos;t request this change, please contact support
            immediately.
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
