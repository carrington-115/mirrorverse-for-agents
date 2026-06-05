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

interface ReengagementEmailProps {
  name: string;
  daysSinceLastRun: number;
  appUrl: string;
  unsubscribeUrl: string;
}

export function ReengagementEmail({
  name,
  daysSinceLastRun,
  appUrl,
  unsubscribeUrl,
}: ReengagementEmailProps) {
  const firstName = name.split(" ")[0] ?? name;
  const isLongInactive = daysSinceLastRun >= 30;

  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>
            {isLongInactive
              ? `We miss you, ${firstName}`
              : `Haven&apos;t seen you in a while, ${firstName}`}
          </Heading>
          <Text style={intro}>
            {isLongInactive
              ? `It&apos;s been ${daysSinceLastRun} days since your last workflow run. A lot has changed — come back and see what&apos;s new.`
              : `You haven&apos;t run any workflows in ${daysSinceLastRun} days. Ready to pick up where you left off?`}
          </Text>
          <Button href={`${appUrl}/workflows`} style={btn}>
            Go to my workflows
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
