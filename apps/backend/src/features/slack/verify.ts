import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

// Slack's request signature scheme (different from the generic
// verifyHmacSignature in features/webhooks/verify.ts, which has no timestamp
// component): https://api.slack.com/authentication/verifying-requests-from-slack
export function verifySlackSignature(
  rawBody: string,
  signingSecret: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
): boolean {
  if (!signatureHeader || !timestampHeader) return false;

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > MAX_TIMESTAMP_SKEW_SECONDS) {
    return false;
  }

  const base = `v0:${timestampHeader}:${rawBody}`;
  const expected = `v0=${createHmac("sha256", signingSecret).update(base).digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}
