import { handleUnsubscribe } from "../../../../src/features/notifications/unsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: Request): Promise<Response> {
  return handleUnsubscribe(req);
}
