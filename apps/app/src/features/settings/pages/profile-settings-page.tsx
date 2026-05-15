import { buildMetadata } from "@/lib/seo/metadata";
import { ProfileSettingsShell } from "@/features/settings/components/settings-profile-shell";

export const metadata = buildMetadata({
  title: "Profile",
  description: "Manage your personal profile information.",
  noIndex: true,
});

export function ProfileSettingsPage() {
  return <ProfileSettingsShell />;
}
