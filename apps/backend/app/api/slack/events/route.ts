import { slackEventsHandler } from "../../../../src/features/slack/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(req: Request): Promise<Response> {
  return slackEventsHandler(req);
}
