import { buildMetadata } from "@/lib/seo/metadata";
import { AppsSettingsShell } from "../components/settings-apps-shell";

export const metadata = buildMetadata({
  title: "Apps",
  description: "Manage connected apps and integrations.",
  noIndex: true,
});

export { AppsSettingsShell as AppsSettingsPage };
