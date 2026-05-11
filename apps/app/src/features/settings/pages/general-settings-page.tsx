import { buildMetadata } from "@/lib/seo/metadata";
import { GeneralSettingsShell } from "@/features/settings/components/settings-general-shell";

export const metadata = buildMetadata({
  title: "General Settings",
  description: "Manage your workspace general settings.",
  noIndex: true,
});

export function GeneralSettingsPage() {
  return <GeneralSettingsShell />;
}
