import { inboundWebhookHandler } from "../../src/features/webhooks/inbound-handler.js";

export const maxDuration = 30;

async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const slug = parts[parts.length - 1] ?? "";
  return inboundWebhookHandler(request, slug);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
