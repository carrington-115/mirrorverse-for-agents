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

interface WeeklyDigestEmailProps {
  totalRuns: number;
  successRate: number;
  topWorkflows: string[];
  appUrl: string;
  unsubscribeUrl: string;
}

export function WeeklyDigestEmail({
  totalRuns,
  successRate,
  topWorkflows,
  appUrl,
  unsubscribeUrl,
}: WeeklyDigestEmailProps) {
  const successPct = Math.round(successRate * 100);

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Your weekly workflow summary</Heading>
          <Section style={statsRow}>
            <Section style={statBox}>
              <Text style={statNumber}>{totalRuns}</Text>
              <Text style={statLabel}>runs this week</Text>
            </Section>
            <Section style={statBox}>
              <Text style={statNumber}>{successPct}%</Text>
              <Text style={statLabel}>success rate</Text>
            </Section>
          </Section>
          {topWorkflows.length > 0 && (
            <>
              <Text style={sectionLabel}>Most active workflows</Text>
              {topWorkflows.map((name) => (
                <Text key={name} style={workflowItem}>
                  · {name}
                </Text>
              ))}
            </>
          )}
          <Button href={`${appUrl}/runs`} style={btn}>
            View all runs
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
  margin: "0 0 24px",
};
const statsRow: React.CSSProperties = {
  display: "flex",
  gap: "16px",
  marginBottom: "32px",
};
const statBox: React.CSSProperties = {
  background: "#f3f4f6",
  borderRadius: "8px",
  padding: "16px 24px",
  flex: 1,
  textAlign: "center",
};
const statNumber: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 4px",
};
const statLabel: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  margin: 0,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const sectionLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  margin: "0 0 8px",
};
const workflowItem: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  margin: "0 0 4px",
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
  marginTop: "24px",
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
