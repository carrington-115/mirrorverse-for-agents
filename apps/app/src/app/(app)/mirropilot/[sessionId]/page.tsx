import type { Metadata } from "next";
import { ChatPage, metadata as pageMetadata } from "@/features/chat/pages/chat-page";

export const metadata: Metadata = pageMetadata;

export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <ChatPage sessionId={sessionId} />;
}
