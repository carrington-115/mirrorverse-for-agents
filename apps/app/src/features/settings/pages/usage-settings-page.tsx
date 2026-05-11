import { buildMetadata } from "@/lib/seo/metadata";
import { UsageSettingsShell } from "../components/settings-usage-shell";

export const metadata = buildMetadata({
  title: "Usage",
  description: "Monitor your workspace usage and limits.",
  noIndex: true,
});

export { UsageSettingsShell as UsageSettingsPage };
