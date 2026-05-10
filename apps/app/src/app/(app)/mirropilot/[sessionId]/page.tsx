import { ChatPage } from "@/features/chat/pages/chat-page";

export { metadata } from "@/features/chat/pages/chat-page";

export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <ChatPage sessionId={sessionId} />;
}
