import type { ReactNode } from "react";
import { WhatsAppDetailShell } from "@/features/deploy/components/whatsapp/whats-app-detail-shell";

export default async function WhatsAppDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WhatsAppDetailShell id={id}>{children}</WhatsAppDetailShell>;
}
