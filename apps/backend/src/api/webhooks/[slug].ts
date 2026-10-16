import { inboundWebhookHandler } from "../../features/webhooks/inbound-handler";
import { checkRateLimit, rateLimitedResponse } from "../../lib/rate-limit";

export const maxDuration = 30;

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const slug = parts[parts.length - 1] ?? "";
  const rateLimit = await checkRateLimit("webhook", slug);
  if (!rateLimit.ok) return rateLimitedResponse(rateLimit.retryAfterSeconds);
  return inboundWebhookHandler(request, slug);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
