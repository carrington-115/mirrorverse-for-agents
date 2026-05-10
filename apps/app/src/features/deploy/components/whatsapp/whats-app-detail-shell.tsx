import { notFound } from "next/navigation";
import { MOCK_WHATSAPP_CHANNELS } from "@/lib/data";
import { WhatsAppDetailHeader } from "./whats-app-detail-header";

interface WhatsAppDetailShellProps {
  id: string;
  children: React.ReactNode;
}

export function WhatsAppDetailShell({ id, children }: WhatsAppDetailShellProps) {
  const channel = MOCK_WHATSAPP_CHANNELS.find((c) => c.id === id);
  if (!channel) notFound();

  return (
    <div className="gap-4 flex w-full flex-col">
      <WhatsAppDetailHeader channel={channel} />
      {children}
    </div>
  );
}
