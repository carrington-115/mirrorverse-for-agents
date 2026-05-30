import { Resend } from "resend";
import { env } from "@mirrorverse/env/backend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}

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
