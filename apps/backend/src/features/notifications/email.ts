import * as React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { env } from "@mirrorverse/env/backend";

import { OtpEmail } from "./templates/otp-email";
import { EmailChangeEmail } from "./templates/email-change";
import { WelcomeEmail } from "./templates/welcome-email";
import { WorkflowFailureEmail } from "./templates/workflow-failure-email";
import { FirstKbEmail } from "./templates/first-kb-email";
import { FirstWorkflowEmail } from "./templates/first-workflow-email";
import { BillingEmail } from "./templates/billing-email";
import type { BillingEmailVariant } from "./templates/billing-email";
import { WeeklyDigestEmail } from "./templates/weekly-digest-email";
import { ReengagementEmail } from "./templates/reengagement-email";

export type { BillingEmailVariant };

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!env.RESEND_API_KEY)
    throw new Error("RESEND_API_KEY is not set — add it to apps/backend/.env");
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}

function unsubscribeUrl(userId: string): string {
  // Simple signed token using userId + a server secret. The unsubscribe route
  // verifies this and sets emailOptOut = true without requiring login.
  const token = Buffer.from(`${userId}:${env.JWT_SECRET}`).toString(
    "base64url",
  );
  return `${env.APP_URL}/api/email/unsubscribe?token=${token}`;
}

// ---------------------------------------------------------------------------
// Auth emails — always sent, ignore opt-out
// ---------------------------------------------------------------------------

export async function sendOtpEmail(
  to: string,
  token: string,
  actionType: "signup" | "magiclink",
): Promise<void> {
  const resend = getResend();
  const html = await render(
    React.createElement(OtpEmail, { token, actionType }),
  );
  const subject =
    actionType === "signup"
      ? "Confirm your email — your code is inside"
      : "Your Mirrorverse sign-in code";
  await resend.emails.send({ from: env.RESEND_FROM_EMAIL, to, subject, html });
}

export async function sendEmailChangeEmail(
  to: string,
  actionType: "email_change_new" | "email_change_current",
  token: string,
  newEmail?: string,
): Promise<void> {
  const resend = getResend();
  const html = await render(
    React.createElement(EmailChangeEmail, { token, actionType, newEmail }),
  );
  const subject =
    actionType === "email_change_new"
      ? "Confirm your new email address"
      : "Your email address is being changed";
  await resend.emails.send({ from: env.RESEND_FROM_EMAIL, to, subject, html });
}

// ---------------------------------------------------------------------------
// Lifecycle emails — respect emailOptOut, sent from marketing address
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(
  to: string,
  name: string,
  userId: string,
): Promise<void> {
  const resend = getResend();
  const html = await render(
    React.createElement(WelcomeEmail, {
      name,
      appUrl: env.APP_URL,
      unsubscribeUrl: unsubscribeUrl(userId),
    }),
  );
  await resend.emails.send({
    from: env.RESEND_MARKETING_FROM_EMAIL,
    to,
    subject: `Welcome to Mirrorverse, ${name.split(" ")[0]}!`,
    html,
  });
}

export async function sendWorkflowFailureEmail(
  to: string,
  workflowName: string,
  errorMessage: string,
  runId: string,
): Promise<void> {
  const resend = getResend();
  const runUrl = `${env.APP_URL}/runs/${runId}`;
  const html = await render(
    React.createElement(WorkflowFailureEmail, {
      workflowName,
      errorMessage,
      runUrl,
    }),
  );
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: `Workflow failed: ${workflowName}`,
    html,
  });
}

export async function sendFirstWorkflowEmail(
  to: string,
  userId: string,
  workflowName: string,
): Promise<void> {
  const resend = getResend();
  const html = await render(
    React.createElement(FirstWorkflowEmail, {
      workflowName,
      appUrl: env.APP_URL,
      unsubscribeUrl: unsubscribeUrl(userId),
    }),
  );
  await resend.emails.send({
    from: env.RESEND_MARKETING_FROM_EMAIL,
    to,
    subject: "Your first Mirrorverse workflow just ran",
    html,
  });
}

export async function sendFirstKbEmail(
  to: string,
  userId: string,
): Promise<void> {
  const resend = getResend();
  const html = await render(
    React.createElement(FirstKbEmail, {
      appUrl: env.APP_URL,
      unsubscribeUrl: unsubscribeUrl(userId),
    }),
  );
  await resend.emails.send({
    from: env.RESEND_MARKETING_FROM_EMAIL,
    to,
    subject: "Your first document is ready in Mirrorverse",
    html,
  });
}

export async function sendBillingEmail(
  to: string,
  variant: BillingEmailVariant,
): Promise<void> {
  const resend = getResend();
  const html = await render(React.createElement(BillingEmail, variant));
  const subjects: Record<BillingEmailVariant["variant"], string> = {
    trial_ending: "Your Mirrorverse trial is ending soon",
    payment_failed: "Action required: payment failed",
    plan_upgraded: "You've been upgraded",
    invoice_paid: "Payment confirmed",
  };
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: subjects[variant.variant],
    html,
  });
}

export interface DigestStats {
  totalRuns: number;
  successRate: number;
  topWorkflows: string[];
}

export async function sendWeeklyDigestEmail(
  to: string,
  userId: string,
  stats: DigestStats,
): Promise<void> {
  const resend = getResend();
  const html = await render(
    React.createElement(WeeklyDigestEmail, {
      ...stats,
      appUrl: env.APP_URL,
      unsubscribeUrl: unsubscribeUrl(userId),
    }),
  );
  await resend.emails.send({
    from: env.RESEND_MARKETING_FROM_EMAIL,
    to,
    subject: "Your Mirrorverse weekly digest",
    html,
  });
}

export async function sendReengagementEmail(
  to: string,
  name: string,
  userId: string,
  daysSinceLastRun: number,
): Promise<void> {
  const resend = getResend();
  const html = await render(
    React.createElement(ReengagementEmail, {
      name,
      daysSinceLastRun,
      appUrl: env.APP_URL,
      unsubscribeUrl: unsubscribeUrl(userId),
    }),
  );
  await resend.emails.send({
    from: env.RESEND_MARKETING_FROM_EMAIL,
    to,
    subject:
      daysSinceLastRun >= 30
        ? "We miss you on Mirrorverse"
        : "Haven't seen you in a while",
    html,
  });
}

// ---------------------------------------------------------------------------
// Legacy — kept for existing human-review workflow nodes
// ---------------------------------------------------------------------------

export async function sendReviewEmail(
  to: string,
  promptText: string,
  reviewUrl: string,
): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: "Action required: workflow review request",
    html: `<p style="font-family:sans-serif;font-size:15px;">${promptText}</p><p style="margin-top:24px;"><a href="${reviewUrl}" style="background:#000;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-family:sans-serif;font-size:14px;">Review Now</a></p>`,
    text: `${promptText}\n\nReview here: ${reviewUrl}`,
  });
}
