import { buildMetadata } from "@/lib/seo/metadata";
import { WhatsAppShell } from "@/features/deploy/components/whatsapp/whats-app-shell";

export const metadata = buildMetadata({
  title: "WhatsApp",
  description: "Manage WhatsApp Business channels for your agents.",
  noIndex: true,
});

export function WhatsAppPage() {
  return <WhatsAppShell />;
}
