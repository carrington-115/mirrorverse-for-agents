import { vapiWebhookHandler } from "../../../../src/features/voice/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(req: Request): Promise<Response> {
  return vapiWebhookHandler(req);
}
