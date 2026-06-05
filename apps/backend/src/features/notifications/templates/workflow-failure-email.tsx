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

interface WorkflowFailureEmailProps {
  workflowName: string;
  errorMessage: string;
  runUrl: string;
}

export function WorkflowFailureEmail({
  workflowName,
  errorMessage,
  runUrl,
}: WorkflowFailureEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Workflow run failed</Heading>
          <Text style={subtitle}>
            <strong>{workflowName}</strong> encountered an error and could not
            complete.
          </Text>
          <Section style={errorBox}>
            <Text style={errorLabel}>Error</Text>
            <Text style={errorText}>{errorMessage}</Text>
          </Section>
          <Button href={runUrl} style={btn}>
            View run details
          </Button>
          <Hr style={hr} />
          <Text style={footer}>Mirrorverse</Text>
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
const subtitle: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  margin: "0 0 24px",
};
const errorBox: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "6px",
  padding: "16px",
  marginBottom: "24px",
};
const errorLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#ef4444",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  margin: "0 0 4px",
};
const errorText: React.CSSProperties = {
  fontSize: "13px",
  color: "#7f1d1d",
  fontFamily: "monospace",
  margin: 0,
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
