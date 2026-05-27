import type { Metadata } from "next";
import { NewChatPage } from "@/features/chat/pages/new-chat-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mirrorpilot",
  description: "Chat with Mirrorpilot to design, debug, and deploy agents.",
  noIndex: true,
});

export default function MirrorpilotIndexPage() {
  return <NewChatPage />;
}
