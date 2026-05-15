import { buildMetadata } from "@/lib/seo/metadata";
import { ChannelsSettingsShell } from "../components/settings-channels-shell";

export const metadata = buildMetadata({
  title: "Channels",
  description: "Configure the channels where your agents are deployed.",
  noIndex: true,
});

export { ChannelsSettingsShell as ChannelsSettingsPage };
