import { handleSupabaseEmailHook } from "../../../../../src/features/auth/hooks/send-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(req: Request): Promise<Response> {
  return handleSupabaseEmailHook(req);
}
