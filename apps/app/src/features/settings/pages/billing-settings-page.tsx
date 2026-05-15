import { buildMetadata } from "@/lib/seo/metadata";
import { BillingSettingsShell } from "@/features/settings/components/settings-billing-shell";

export const metadata = buildMetadata({
  title: "Billing",
  description: "Manage your subscription, payment method, and invoices.",
  noIndex: true,
});

export function BillingSettingsPage() {
  return <BillingSettingsShell />;
}
