import { buildMetadata } from "@/lib/seo/metadata";
import { SecuritySettingsShell } from "@/features/settings/components/settings-security-shell";

export const metadata = buildMetadata({
  title: "Security",
  description: "Manage API keys and active sessions.",
  noIndex: true,
});

export function SecuritySettingsPage() {
  return <SecuritySettingsShell />;
}
