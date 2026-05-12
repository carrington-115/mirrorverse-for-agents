import { DefaultChatTransport, type UIMessage } from "ai";

import { env } from "@mirrorverse/env/app";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const CHAT_ENDPOINT = `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/chat`;

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = createSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (data.session) headers.authorization = `Bearer ${data.session.access_token}`;
  return headers;
}

export function buildChatTransport(sessionId: string): DefaultChatTransport<UIMessage> {
  return new DefaultChatTransport<UIMessage>({
    api: CHAT_ENDPOINT,
    credentials: "include",
    headers: authHeaders,
    body: { chatId: sessionId },
  });
}
