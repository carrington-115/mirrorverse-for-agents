import { notFound } from "next/navigation";
import { MOCK_WHATSAPP_CHANNELS } from "@/lib/data";
import WhatsAppDetailHeader from "./_components/whats-app-detail-header";

export default async function WhatsAppDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const channel = MOCK_WHATSAPP_CHANNELS.find((c) => c.id === id);
  if (!channel) notFound();

  return (
    <div className="gap-4 flex w-full flex-col">
      <WhatsAppDetailHeader channel={channel} />
      {children}
    </div>
  );
}
