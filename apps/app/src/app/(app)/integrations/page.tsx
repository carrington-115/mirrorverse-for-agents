import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";
import { IntegrationsPage } from "@/features/integrations/pages/integrations-page";

export const metadata: Metadata = buildMetadata({
  title: "Integrations",
  description: "Connect Mirroverse to the apps, tools, and services your agents use.",
  noIndex: true,
});

export default function Page() {
  return <IntegrationsPage />;
}
