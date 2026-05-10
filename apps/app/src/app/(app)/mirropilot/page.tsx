import { redirect } from "next/navigation";
import { generateSessionId } from "@/features/chat/actions/generate-session-id";

export default async function MirropilotIndexPage() {
  const sessionId = await generateSessionId();
  redirect(`/mirropilot/${sessionId}`);
}
