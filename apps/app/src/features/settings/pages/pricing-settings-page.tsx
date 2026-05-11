import { buildMetadata } from "@/lib/seo/metadata";
import { PricingSettingsShell } from "@/features/settings/components/settings-pricing-shell";

export const metadata = buildMetadata({
  title: "Pricing",
  description: "View and manage your workspace plan.",
  noIndex: true,
});

export function PricingSettingsPage() {
  return <PricingSettingsShell />;
}
