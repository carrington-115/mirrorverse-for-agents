import { buildMetadata } from "@/lib/seo/metadata";
import { ChatShell } from "@/features/chat/components/chat-shell";

export const metadata = buildMetadata({
  title: "Mirropilot",
  description: "Chat with Mirropilot to design, debug, and deploy agents.",
  noIndex: true,
});

interface ChatPageProps {
  sessionId: string;
}

export function ChatPage({ sessionId }: ChatPageProps) {
  return (
    <div className="flex size-full flex-col">
      <ChatShell sessionId={sessionId} />
    </div>
  );
}
