import { notFound } from "next/navigation";
import { MOCK_WHATSAPP_CHANNELS } from "@/lib/data";
import WhatsAppDetailHeader from "./_components/WhatsAppDetailHeader";

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
    <div className="flex flex-col gap-4 w-full">
      <WhatsAppDetailHeader channel={channel} />
      {children}
    </div>
  );
}
