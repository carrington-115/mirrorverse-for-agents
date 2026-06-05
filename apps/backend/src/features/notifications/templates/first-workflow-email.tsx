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

interface FirstWorkflowEmailProps {
  workflowName: string;
  appUrl: string;
  unsubscribeUrl: string;
}

export function FirstWorkflowEmail({
  workflowName,
  appUrl,
  unsubscribeUrl,
}: FirstWorkflowEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Your first workflow ran successfully 🎉</Heading>
          <Text style={intro}>
            <strong>{workflowName}</strong> just completed its first run.
            You&apos;re up and running with Mirrorverse.
          </Text>
          <Text style={tip}>
            <strong>Next:</strong> Add a trigger to run this workflow
            automatically — on a schedule, via webhook, or when a channel event
            fires.
          </Text>
          <Button href={`${appUrl}/workflows`} style={btn}>
            View my workflows
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
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
  fontSize: "22px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 8px",
};
const intro: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  margin: "0 0 16px",
};
const tip: React.CSSProperties = {
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
const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0 16px",
};
const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: 0,
};
const unsubLink: React.CSSProperties = {
  color: "#9ca3af",
  textDecoration: "underline",
};
