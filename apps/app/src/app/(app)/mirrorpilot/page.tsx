import { redirect } from "next/navigation";
import { generateSessionId } from "@/features/chat/actions/generate-session-id";

export default async function MirrorpilotIndexPage() {
  const sessionId = await generateSessionId();
  redirect(`/mirrorpilot/${sessionId}`);
}
