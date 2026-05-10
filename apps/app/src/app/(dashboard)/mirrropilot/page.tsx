import { redirect } from "next/navigation";
import { generateSessionId } from "./actions";

export default async function MirrropilotIndexPage() {
  const sessionId = await generateSessionId();
  redirect(`/mirrropilot/${sessionId}`);
}
